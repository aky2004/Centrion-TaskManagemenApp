const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { checkProjectPermission } = require('../utils/permissionUtils');



/**
 * @desc    Get all projects for a workspace
 * @route   GET /api/projects?workspace=:workspaceId
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
  try {
    const { workspace } = req.query;
    // Filter by projects where user is owner or ACTIVE member (not pending invitations)
    const query = {
      $or: [
        { owner: req.user._id },
        { members: { $elemMatch: { user: req.user._id, status: 'active' } } }
      ]
    };

    if (workspace) query.workspace = workspace;

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    // Clean: filter owner out of members array for each project
    const cleanedProjects = projects.map(p => {
      const proj = p.toObject();
      const ownerId = proj.owner?._id?.toString() || proj.owner?.toString();
      proj.members = (proj.members || []).filter(m => {
        const memberId = m.user?._id?.toString() || m.user?.toString();
        return memberId !== ownerId;
      });
      return proj;
    });

    res.status(200).json({
      success: true,
      count: cleanedProjects.length,
      projects: cleanedProjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('workspace', 'name');

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check access
    if (!checkProjectPermission(project, req.user._id, 'viewer')) {
      return next(new AppError('Not authorized to view this project', 403));
    }

    // Clean: filter owner out of members array
    const cleanProject = project.toObject();
    const ownerId = cleanProject.owner?._id?.toString() || cleanProject.owner?.toString();
    cleanProject.members = (cleanProject.members || []).filter(m => {
      const memberId = m.user?._id?.toString() || m.user?.toString();
      return memberId !== ownerId;
    });

    res.status(200).json({
      success: true,
      project: cleanProject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, workspace, color, columns } = req.body;

    // Verify workspace exists
    const workspaceDoc = await Workspace.findById(workspace);
    if (!workspaceDoc) {
      return next(new AppError('Workspace not found', 404));
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      workspace,
      owner: req.user._id,
      color,
      columns: columns || [
        { name: 'To Do', order: 0 },
        { name: 'In Progress', order: 1 },
        { name: 'Review', order: 2 },
        { name: 'Completed', order: 3 },
      ],
      members: [], // Initialize with empty members (Owner is in owner field)
    });

    await project.populate('owner', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check authorization - Only Owner can update settings
    if (project.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the project owner can update settings', 403));
    }

    const { name, description, color, columns } = req.body;

    if (name) project.name = name;
    if (description) project.description = description;
    if (color) project.color = color;
    if (columns) project.columns = columns;

    project = await project.save();
    await project.populate('owner', 'name email avatar');

    res.json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check authorization - Only Owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the project owner can delete this project', 403));
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invite member to project
 * @route   POST /api/projects/:id/members
 * @access  Private
 */
exports.addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check permissions - Only Owner can invite
    if (project.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the project owner can invite members', 403));
    }

    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return next(new AppError('User not found with this email', 404));
    }
    
    // Check if trying to add self
    if (userToAdd._id.toString() === req.user._id.toString()) {
         return next(new AppError('You cannot invite yourself', 400));
    }

    // Check if user is already a member
    const existingMember = project.members.find(m => m.user.toString() === userToAdd._id.toString());
    if (existingMember) {
        if (existingMember.status === 'active') {
            return next(new AppError('User is already a project member', 400));
        } else if (existingMember.status === 'pending') {
            return next(new AppError('Invitation already sent to this user', 400));
        }
    }

    // Add with pending status
    if (existingMember) {
        // Re-invite if declined or update role
        existingMember.status = 'pending';
        existingMember.role = role || 'editor';
        existingMember.addedAt = Date.now();
    } else {
        project.members.push({
          user: userToAdd._id,
          role: role || 'editor',
          status: 'pending'
        });
    }

    await project.save();
    
    // Create detailed notification for the invited user
    await Notification.create({
        recipient: userToAdd._id,
        sender: req.user._id,
        type: 'project-invited',
        title: 'Project Invitation',
        message: `${req.user.name} invited you to join "${project.name}" as ${role || 'editor'}`,
        relatedProject: project._id,
        link: `/projects/${project._id}/accept-invite` // Frontend route to handle acceptance
    });

    await project.populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private
 */
exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check permissions - Only Owner can remove members
    // Or users can remove themselves (leave project)
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isSelf = userId === req.user._id.toString();

    if (!isOwner && !isSelf) {
      return next(new AppError('Not authorized to remove members', 403));
    }

    // Prevent removing owner via this endpoint
    if (project.owner.toString() === userId) {
      return next(new AppError('Cannot leave project as owner. Transfer ownership first.', 400));
    }

    project.members = project.members.filter(m => m.user.toString() !== userId);

    project = await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: isSelf ? 'You have left the project' : 'Member removed successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept/Decline project invitation
 * @route   POST /api/projects/:id/invitation
 * @access  Private
 */
exports.respondToInvitation = async (req, res, next) => {
    try {
        const { status } = req.body; // 'active' or 'declined'
        if (!['active', 'declined'].includes(status)) {
            return next(new AppError('Invalid status', 400));
        }

        let project = await Project.findById(req.params.id);
        if (!project) return next(new AppError('Project not found', 404));

        const member = project.members.find(m => m.user.toString() === req.user._id.toString());
        
        if (!member) return next(new AppError('No invitation found for this project', 404));
        if (member.status === 'active') return next(new AppError('You are already a member', 400));

        if (status === 'declined') {
            // Remove from members
            project.members = project.members.filter(m => m.user.toString() !== req.user._id.toString());
        } else {
            member.status = 'active';
            
            // Notify owner
             await Notification.create({
                recipient: project.owner,
                sender: req.user._id,
                type: 'project-invited', // reusing type or adding new one
                title: 'Invitation Accepted',
                message: `${req.user.name} accepted your invitation to "${project.name}"`,
                relatedProject: project._id,
            });
        }

        await project.save();
        
        res.status(200).json({
            success: true,
            message: status === 'active' ? 'Invitation accepted' : 'Invitation declined'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Transfer ownership
 * @route   PUT /api/projects/:id/transfer-ownership
 * @access  Private
 */
exports.transferOwnership = async (req, res, next) => {
    try {
        const { newOwnerId } = req.body;
        
        let project = await Project.findById(req.params.id);
        if (!project) return next(new AppError('Project not found', 404));

        // Only current owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized', 403));
        }
        
        // Check if new owner is a member
        const memberIndex = project.members.findIndex(m => m.user.toString() === newOwnerId);
        if (memberIndex === -1) {
            return next(new AppError('New owner must be a project member first', 400));
        }

        // Swap
        const oldOwnerId = project.owner;
        project.owner = newOwnerId;
        
        // Remove new owner from members array (as they are now owner)
        project.members.splice(memberIndex, 1);
        
        // Add old owner to members array as editor (optional, logical fallback)
        project.members.push({
            user: oldOwnerId,
            role: 'editor',
            status: 'active'
        });

        await project.save();
        await project.populate('owner', 'name email avatar');
        
        res.status(200).json({
            success: true,
            message: 'Ownership transferred successfully',
            project
        });

    } catch (error) {
        next(error);
    }
};
