import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/sendEmail.js';
import { customErrorHandler, successResponse, errorResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';
import { createMilestoneEscrowPayment } from '../controllers/paymentController.js';
import Bid from '../models/Bid.js';

// Freelancer responds to a job offer
export const respondToJobOffer = async (req, res) => {
  try {
    const { jobId, offerId } = req.params;
    const { accept } = req.body;

    const job = await Job.findById(jobId).populate('client');
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    const offer = job.offers.id(offerId);
    if (!offer) return customErrorHandler(res, new Error('Offer not found'), 404);

    if (offer.freelancer.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, new Error('Unauthorized: This offer is not for you'), 403);
    }

    if (offer.status !== 'pending') {
      return customErrorHandler(res, new Error('This offer is no longer pending'), 400);
    }

    if (accept) {
      // Accept the offer
      offer.status = 'accepted';
      job.status = 'in-progress';
      job.hiredFreelancer = req.user._id;

      // Update the bid status
      await Bid.findOneAndUpdate(
        { job: jobId, freelancer: req.user._id },
        { status: 'accepted' }
      );

      const milestoneId = new mongoose.Types.ObjectId();
      const initialMilestone = {
        _id: milestoneId,
        title: offer.milestoneTitle,
        description: offer.milestoneDescription,
        amount: offer.milestoneAmount,
        deadline: new Date(offer.milestoneDeadline),
        status: 'in-progress'
      };
      if (!job.milestones) {
        job.milestones = [];
      }
      job.milestones.push(initialMilestone);

      // Create milestone escrow payment
      try {
        const payment = await createMilestoneEscrowPayment(
            job._id,
            req.user._id,
            milestoneId,
            offer.milestoneAmount,
            job.client._id
          );
        initialMilestone.paymentId = payment._id;
      } catch (error) {
        console.log(offer.milestoneAmount)
        return customErrorHandler(res, new Error('Failed to create escrow payment'), 500);
      }

      const freelancer = await User.findById(req.user._id);
      if (!freelancer.totalHires) {
        freelancer.totalHires = [];
      }
      freelancer.totalHires.push({
        job: job._id,
        role: 'Individual Hire',
        totalBudget: offer.milestoneAmount,
        earned: 0
      });
      await freelancer.save();

      // Update client
      const client = job.client;
      if (!client.totalHires) {
        client.totalHires = [];
      }
      client.totalHires.push({
        freelancer: {
          id: freelancer._id,
          name: freelancer.name,
          skills: freelancer.skills
        },
        job: {
          id: job._id,
          title: job.title,
          totalBudget: job.budget,
          paid: 0
        },
        activeMilestones: [initialMilestone._id],
        approvedMilestones: [],
        totalPaid: 0,
        pendingPayment: offer.milestoneAmount
      });
      await client.save();

      // Notify client
      await Notification.create({
        recipient: job.client._id,
        type: 'job-updated',
        title: 'Job Offer Accepted',
        message: `Your offer for "${job.title}" has been accepted by the freelancer.`,
        data: {
          job: job._id,
          freelancer: freelancer._id,
        },
      });

      // Send email notification
      await sendEmail({
        to: client.email,
       subject: 'Job Offer Accepted',
        text: `The freelancer has accepted your offer for the job "${job.title}".`}
      );

      await sendEmail({
        to:freelancer.email,
        subject:'Job Offer Accepted',
        text:`Your Job "${job.title} has been started".`}
      );
    } else {
      // Reject the offer
      offer.status = 'rejected';

      // Notify client
      await Notification.create({
        recipient: job.client._id,
        type: 'job-updated',
        title: 'Job Offer Rejected',
        message: `Your offer for "${job.title}" has been rejected by the freelancer.`,
        data: {
          job: job._id,
          freelancer: req.user._id,
        },
      });

      // Send email notification
      const client = job.client;
      await sendEmail({
        to:client.email,
        subject:'Job Offer Rejected',
        text:`The freelancer has rejected your offer for the job "${job.title}".`}
      );
    }

    await job.save();

    return successResponse(res, 200, `Job offer ${accept ? 'accepted' : 'rejected'} successfully`);
  } catch (error) {
    return customErrorHandler(res, error);
  }
};

// Freelancer responds to a team offer
export const respondToTeamOffer = async (req, res) => {
  try {
    const { jobId, offerId } = req.params;
    const { accept } = req.body;

    const job = await Job.findById(jobId).populate('client');
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    const offer = job.teamOffers.id(offerId);
    if (!offer) return customErrorHandler(res, new Error('Team offer not found'), 404);

    if (offer.freelancer.toString() !== req.user._id.toString()) {
      return customErrorHandler(res, new Error('Unauthorized: This team offer is not for you'), 403);
    }

    if (offer.status !== 'pending') {
      return customErrorHandler(res, new Error('This team offer is no longer pending'), 400);
    }

    if (accept) {
      // Accept the offer
      offer.status = 'accepted';
      job.status = 'in-progress';
      job.hiredFreelancer = req.user._id;
      await Bid.findOneAndUpdate(
        { job: jobId, freelancer: req.user._id },
        { status: 'accepted' }
      );
      
      const milestoneId = new mongoose.Types.ObjectId();
      const initialMilestone = {
        _id: milestoneId,
        title: offer.milestoneTitle,
        description: offer.milestoneDescription,
        amount: offer.milestoneAmount,
        deadline: new Date(offer.milestoneDeadline),
        status: 'in-progress'
      };

      // Create milestone escrow payment
      try {
        // In freelancerController.js
        const payment = await createMilestoneEscrowPayment(
          job._id,
          req.user._id,
          milestoneId,
          offer.milestoneAmount,
          job.client._id
        );
      initialMilestone.paymentId = payment._id;
      } catch (error) {
        return customErrorHandler(res, new Error('Failed to create escrow payment'), 500);
      }

      // Add team member to job
      job.team.push({ 
        freelancer: req.user._id, 
        role: offer.role, 
        bid: offer.bid,
        skills: job.crowdsourcingRoles.find(r => r.title === offer.role).skills,
        milestones: [initialMilestone]
      });

      // Update role status
      const role = job.crowdsourcingRoles.find(r => r.title === offer.role);
      role.status = 'filled';

      // Update job status if all roles are filled
      if (job.crowdsourcingRoles.every(r => r.status === 'filled')) {
        job.status = 'in-progress';
      }

      // Add freelancer to group conversation
      // const conversation = await Conversation.findById(job.groupConversation);
      // if (conversation) {
      //   conversation.participants.push(req.user._id);
      //   await conversation.save();
      // }

      const freelancer = await User.findById(req.user._id);
      if (!freelancer.totalHires) {
        freelancer.totalHires = [];
      }
      freelancer.totalHires.push({
        job: job._id,
        role: offer.role,
        totalBudget: offer.milestoneAmount,
        earned: 0
      });
      freelancer.payments.inProgress += offer.milestoneAmount;
      await freelancer.save();

      const client = job.client;
      if (!client.totalHires) {
        client.totalHires = [];
      }
      client.totalHires.push({
        freelancer: {
          id: freelancer._id,
          name: freelancer.name,
          skills: freelancer.skills
        },
        job: {
          id: job._id,
          title: job.title,
          totalBudget: job.budget,
          paid: 0
        },
        activeMilestones: [initialMilestone._id],
        approvedMilestones: [],
        totalPaid: 0,
        pendingPayment: offer.milestoneAmount
      });
      await client.save();

      // Notify client
      await Notification.create({
        recipient: job.client._id,
        type: 'new-message',
        title: 'Team Offer Accepted',
        message: `Your team offer for "${job.title}" (${offer.role}) has been accepted by the freelancer.`,
        data: {
          job: job._id,
          freelancer: freelancer._id,
          role: offer.role
        },
      });

      // Send email notification
      await sendEmail({
       to: client.email,
       subject: 'Team Offer Accepted',
        text:`The freelancer has accepted your team offer for the job "${job.title}" (${offer.role}).`}
      );
    } else {
      // Reject the offer
      offer.status = 'rejected';

      // Notify client
      await Notification.create({
        recipient: job.client._id,
        type: 'job-updated',
        title: 'Team Offer Rejected',
        message: `Your team offer for "${job.title}" (${offer.role}) has been rejected by the freelancer.`,
        data: {
          job: job._id,
          freelancer: req.user._id,
          role: offer.role
        },
      });

      // Send email notification
      const client = job.client;
      await sendEmail({
       to: client.email,
       subject: 'Team Offer Rejected',
        text:`The freelancer has rejected your team offer for the job "${job.title}" (${offer.role}).`}
      );
    }

    await job.save();

    return successResponse(res, 200, `Team offer ${accept ? 'accepted' : 'rejected'} successfully`);
  } catch (error) {
    return customErrorHandler(res, error);
  }
};

// Get all pending offers for a freelancer
export const getPendingOffers = async (req, res) => {
  try {
    const jobs = await Job.find({
      $or: [
        { 'offers': { $elemMatch: { freelancer: req.user._id, status: 'pending' } } },
        { 'teamOffers': { $elemMatch: { freelancer: req.user._id, status: 'pending' } } }
      ]
    }).select('title client offers teamOffers isCrowdsourced')
      .populate('client', 'name profilePic companyName');

    const pendingOffers = jobs.flatMap(job => {
      const individualOffers = job.offers
        .filter(offer => offer.freelancer.toString() === req.user._id.toString() && offer.status === 'pending')
        .map(offer => ({
          jobId: job._id,
          jobTitle: job.title,
          client: {
            _id: job.client._id,
            name: job.client.name,
            profilePic: job.client.profilePic,
            companyName: job.client.companyName
          },
          offerType: 'individual',
          isCrowdsourced: job.isCrowdsourced,
          ...offer.toObject()
        }));
    
      const teamOffers = job.teamOffers
        .filter(offer => offer.freelancer.toString() === req.user._id.toString() && offer.status === 'pending')
        .map(offer => ({
          jobId: job._id,
          jobTitle: job.title,
          client: {
            _id: job.client._id,
            name: job.client.name,
            profilePic: job.client.profilePic,
            companyName: job.client.companyName
          },
          offerType: 'team',
          isCrowdsourced: job.isCrowdsourced,
          title: offer.milestoneTitle,
          description: offer.milestoneDescription,
          amount: offer.milestoneAmount,
          deadline: offer.milestoneDeadline,
          ...offer.toObject()
        }));

      return [...individualOffers, ...teamOffers];
    });

    return successResponse(res, 200, 'Pending offers retrieved successfully', pendingOffers);
  } catch (error) {
    return customErrorHandler(res, error);
  }
};

export const searchFreelancers = async (req, res) => {
  try {
    const {
      title,
      skills,
      hourlyRate,
      availability,
      rating,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { role: 'freelancer', isActive: true };

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (skills) {
      query.skills = { $in: skills.split(',').map(skill => new RegExp(skill.trim(), 'i')) };
    }

    if (hourlyRate) {
      const [min, max] = hourlyRate.split('-');
      query.hourlyRate = {};
      if (min) query.hourlyRate.$gte = parseFloat(min);
      if (max) query.hourlyRate.$lte = parseFloat(max);
    }

    if (availability) {
      query.availability = availability;
    }

    if (rating) {
      query.successRate = { $gte: parseFloat(rating) };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
      select: 'name title skills hourlyRate availability successRate completedJobs profilePic',
      lean: true
    };

    const freelancers = await User.paginate(query, options);

    return successResponse(res, 200, 'Freelancers retrieved successfully', {
      freelancers: freelancers.docs,
      currentPage: freelancers.page,
      totalPages: freelancers.totalPages,
      totalFreelancers: freelancers.totalDocs
    });
  } catch (error) {
    console.error('Search freelancers error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};


export const submitMilestone = async (req, res) => {
  try {
    const { jobId, milestoneId } = req.params;
    const { message, attachments } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return customErrorHandler(res, new Error('Job not found'), 404);
    }

    let milestone;
    if (job.isCrowdsourced) {
      const teamMember = job.team.find(member => member.freelancer.toString() === req.user._id.toString());
      if (!teamMember) {
        return customErrorHandler(res, new Error('You are not a member of this team'), 403);
      }
      milestone = teamMember.milestones.id(milestoneId);
    } else {
      if (job.hiredFreelancer.toString() !== req.user._id.toString()) {
        return customErrorHandler(res, new Error('You are not authorized to submit this milestone'), 403);
      }
      milestone = job.milestones.id(milestoneId);
    }

    if (!milestone) {
      return customErrorHandler(res, new Error('Milestone not found'), 404);
    }

    if (milestone.status !== 'in-progress') {
      return customErrorHandler(res, new Error('This milestone is not in progress'), 400);
    }

    // Update milestone
    milestone.status = 'submitted';
    milestone.submission = {
      message,
      attachments: attachments.map(attachment => ({
        url: attachment.url
      })),
      submittedAt: new Date(),
    };

    await job.save();

    // Notify client
    await Notification.create({
      recipient: job.client,
      type: 'milestone-submitted',
      title: 'Milestone Submitted',
      message: `A milestone for "${job.title}" has been submitted for review.`,
      data: {
        job: job._id,
        milestone: milestone._id,
      },
    });

    // Send email notification to client
    const client = await User.findById(job.client);
    await sendEmail({
      to: client.email,
      subject: 'Milestone Submitted for Review',
      text: `A milestone for the job "${job.title}" has been submitted for your review. Please log in to your account to check the submission and provide feedback.`,
    });

    return successResponse(res, 200, 'Milestone submitted successfully', {
      milestone: milestone,
    });
  } catch (error) {
    return customErrorHandler(res, error);
  }
};


// ... existing code ...

export const submitRevision = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { revisionNotes, attachments } = req.body;

    const job = await Job.findById(id);
    if (!job) return customErrorHandler(res, new Error('Job not found'), 404);

    let milestone;
    let isFreelancerAuthorized = false;

    if (job.isCrowdsourced) {
      const teamMember = job.team.find(member => 
        member.freelancer.toString() === req.user._id.toString() &&
        member.milestones.some(m => m._id.toString() === milestoneId)
      );
      if (teamMember) {
        milestone = teamMember.milestones.id(milestoneId);
        isFreelancerAuthorized = true;
      }
    } else {
      if (job.hiredFreelancer.toString() === req.user._id.toString()) {
        milestone = job.milestones.id(milestoneId);
        isFreelancerAuthorized = true;
      }
    }

    if (!isFreelancerAuthorized) {
      return customErrorHandler(res, new Error('Unauthorized: You are not assigned to this milestone'), 403);
    }

    if (!milestone) return customErrorHandler(res, new Error('Milestone not found'), 404);

    if (milestone.status !== 'in-revision') {
      return customErrorHandler(res, new Error('Can only submit revision for milestones in revision'), 400);
    }

    // Update the revision object
    milestone.revision = {
      ...milestone.revision,
      freelancerNotes: revisionNotes,
      freelancerAttachments: attachments,
      submittedAt: new Date(),
      status: 'submitted'
    };

    milestone.status = 'submitted';
    await job.save();

    // Send notification to client
    await Notification.create({
      recipient: job.client,
      type: 'revision-submitted',
      title: 'Revision Submitted',
      message: `A revision has been submitted for the milestone "${milestone.title}" in job "${job.title}".`,
      data: {
        job: job._id,
        milestone: milestone._id,
      },
    });

    // Send email notification to client
    const client = await User.findById(job.client);
    await sendEmail({
      to: client.email,
      subject: 'Revision Submitted',
      text: `A revision has been submitted for the milestone "${milestone.title}" in job "${job.title}". Please check your dashboard to review.`
    });

    return successResponse(res, 200, 'Revision submitted successfully', { milestone });
  } catch (error) {
    console.error('Error in submitRevision:', error);
    return customErrorHandler(res, error);
  }
};

