import Complaint from '../models/Complaint.model.js';
import Officer from '../models/Officer.model.js';
import ComplaintTransfer from '../models/ComplaintTransfer.model.js';
import { sendEmail } from './email.js';

/**
 * Smart Complaint Routing Bot
 * Automatically assigns complaints to appropriate officers based on:
 * 1. Department match
 * 2. Ward jurisdiction
 * 3. Officer workload (least assigned)
 * 4. Officer availability
 */

export class ComplaintRoutingBot {
  /**
   * Route a single complaint to the best available officer
   */
  static async routeComplaint(complaintId) {
    try {
      const complaint = await Complaint.findById(complaintId).populate('citizen', 'name email');

      if (!complaint) {
        console.error(`Complaint ${complaintId} not found`);
        return null;
      }

      // Skip if already assigned to an officer
      if (complaint.assignedOfficer) {
        console.log(`Complaint ${complaintId} already assigned to officer`);
        return null;
      }

      // Skip if not in pending status
      if (complaint.status !== 'pending') {
        console.log(`Complaint ${complaintId} status is ${complaint.status}, skipping routing`);
        return null;
      }

      const officer = await this.findBestOfficer(complaint);

      if (!officer) {
        console.log(`No available officer found for complaint ${complaintId}`);
        return null;
      }

      // Assign complaint to officer
      return await this.assignOfficerToComplaint(complaint, officer);
    } catch (error) {
      console.error(`Error routing complaint ${complaintId}:`, error);
      return null;
    }
  }

  /**
   * Route multiple pending complaints
   */
  static async routePendingComplaints(limit = 50) {
    try {
      const pendingComplaints = await Complaint.find({
        status: 'pending',
        assignedOfficer: null,
      })
        .limit(limit)
        .sort({ priority: 1, createdAt: 1 }); // High priority first

      console.log(`Found ${pendingComplaints.length} pending complaints to route`);

      const results = [];
      for (const complaint of pendingComplaints) {
        const result = await this.routeComplaint(complaint._id);
        if (result) {
          results.push(result);
        }
      }

      console.log(`Successfully routed ${results.length} complaints`);
      return {
        totalRouted: results.length,
        results,
      };
    } catch (error) {
      console.error('Error in batch routing:', error);
      throw error;
    }
  }

  /**
   * Find the best officer for a complaint
   * Scoring: Department match (40%) + Ward jurisdiction (30%) + Low workload (30%)
   */
  static async findBestOfficer(complaint) {
    try {
      // Get all active and available officers in the same department
      const officers = await Officer.find({
        department: complaint.department,
        isActive: true,
        isAvailable: true,
      });

      if (officers.length === 0) {
        console.log(`No available officers in ${complaint.department} department`);
        return null;
      }

      // Score each officer
      let bestOfficer = null;
      let bestScore = -1;

      for (const officer of officers) {
        let score = 0;

        // Department match (40%)
        if (officer.department === complaint.department) {
          score += 40;
        }

        // Ward jurisdiction (30%)
        if (
          officer.jurisdiction.wards &&
          officer.jurisdiction.wards.length > 0 &&
          officer.jurisdiction.wards.includes(complaint.location.ward)
        ) {
          score += 30;
        }

        // Workload balance (30%)
        // Officers with fewer complaints get higher scores
        const maxComplaints = 50; // Assumption: max ideal complaints per officer
        const workloadScore = Math.max(0, (maxComplaints - officer.assignedCount) / maxComplaints) * 30;
        score += workloadScore;

        // Specialization bonus (5%)
        if (this.isSpecialistForCategory(officer.designation, complaint.category)) {
          score += 5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestOfficer = officer;
        }
      }

      console.log(`Best officer for complaint ${complaint.complaintId}: ${bestOfficer.name} (score: ${bestScore})`);
      return bestOfficer;
    } catch (error) {
      console.error('Error finding best officer:', error);
      return null;
    }
  }

  /**
   * Assign an officer to a complaint
   */
  static async assignOfficerToComplaint(complaint, officer) {
    try {
      // Create transfer record
      const transfer = await ComplaintTransfer.create({
        complaint: complaint._id,
        fromDepartment: complaint.department,
        toDepartment: officer.department,
        toOfficer: officer._id,
        transferReason: 'auto_routing',
        notes: 'Automatically routed by complaint routing bot',
        status: 'accepted',
        acceptedAt: new Date(),
      });

      // Update complaint
      complaint.assignedOfficer = officer._id;
      complaint.officerAssignedAt = new Date();
      complaint.transfers.push(transfer._id);
      complaint.status = 'under_review';
      complaint.statusHistory.push({
        status: 'under_review',
        comment: `Automatically assigned to ${officer.designation} ${officer.name} (${officer.station})`,
        timestamp: new Date(),
      });

      await complaint.save();

      // Update officer
      if (!officer.assignedComplaints.includes(complaint._id)) {
        officer.assignedComplaints.push(complaint._id);
      }
      officer.assignedCount = officer.assignedComplaints.length;
      await officer.save();

      // Send notifications
      await this.sendAssignmentNotifications(complaint, officer);

      return {
        complaintId: complaint.complaintId,
        officer: officer.name,
        department: officer.department,
        designation: officer.designation,
        status: 'assigned',
      };
    } catch (error) {
      console.error(`Error assigning officer to complaint ${complaint.complaintId}:`, error);
      throw error;
    }
  }

  /**
   * Check if officer specialization matches complaint category
   */
  static isSpecialistForCategory(designation, category) {
    const specializations = {
      police: ['illegal_construction', 'noise', 'public_transport'],
      health_inspector: ['health', 'sanitation'],
      traffic_officer: ['roads', 'public_transport'],
      sanitation_officer: ['sanitation'],
      water_manager: ['water'],
      electricity_manager: ['electricity'],
      parks_manager: ['parks'],
    };

    return specializations[designation]?.includes(category) || false;
  }

  /**
   * Send notifications to officer and citizen
   */
  static async sendAssignmentNotifications(complaint, officer) {
    try {
      // Notify officer
      await sendEmail({
        email: officer.email,
        subject: `🚨 New Complaint Assigned: ${complaint.complaintId}`,
        message: `Hello ${officer.name},\n\nA new complaint has been automatically assigned to you through our smart routing system.\n\n📋 **Complaint Details:**\nID: ${complaint.complaintId}\nTitle: ${complaint.title}\nCategory: ${complaint.category}\nPriority: ${complaint.priority.toUpperCase()}\nLocation: ${complaint.location.address}\nWard: ${complaint.location.ward}\n\n📸 Evidence: ${complaint.images.length} image(s) attached\n\n⏰ **Please take action within the next 24-48 hours.**\n\nLog in to the platform to view full details and update status.\n\nBest regards,\nSmart City Complaint Management System`,
      });

      // Notify citizen
      if (complaint.citizen && complaint.citizen.email && !complaint.isAnonymous) {
        await sendEmail({
          email: complaint.citizen.email,
          subject: `✅ Your Complaint has been Assigned: ${complaint.complaintId}`,
          message: `Hello ${complaint.citizen.name},\n\nGood news! Your complaint has been assigned to a dedicated officer for resolution.\n\n👤 **Assigned To:**\n${officer.designation.replace(/_/g, ' ').toUpperCase()}: ${officer.name}\nDepartment: ${officer.department}\nStation: ${officer.station}\nContact: ${officer.email}\n\n📝 **Your Complaint:**\nID: ${complaint.complaintId}\nTitle: ${complaint.title}\nStatus: UNDER REVIEW\n\nYou will receive updates as your complaint is being resolved.\n\nThank you for helping us improve the city!\n\nBest regards,\nSmart City Team`,
        });
      }

      console.log(`Notifications sent for complaint ${complaint.complaintId}`);
    } catch (error) {
      console.error(`Error sending notifications for complaint ${complaint.complaintId}:`, error);
      // Don't throw - notifications are secondary
    }
  }

  /**
   * Escalate overdue complaints to higher priority
   */
  static async escalateOverdueComplaints() {
    try {
      const now = new Date();
      const escalationThreshold = 48; // hours

      const overdueComplaints = await Complaint.find({
        status: { $in: ['pending', 'under_review'] },
        createdAt: { $lt: new Date(now - escalationThreshold * 60 * 60 * 1000) },
        priority: { $in: ['low', 'medium'] },
      });

      let escalatedCount = 0;

      for (const complaint of overdueComplaints) {
        complaint.priority = complaint.priority === 'low' ? 'medium' : 'high';
        complaint.statusHistory.push({
          status: complaint.status,
          comment: `Priority escalated to ${complaint.priority} due to time elapsed`,
          timestamp: new Date(),
        });
        await complaint.save();
        escalatedCount++;
      }

      console.log(`Escalated ${escalatedCount} overdue complaints`);
      return escalatedCount;
    } catch (error) {
      console.error('Error escalating complaints:', error);
      throw error;
    }
  }

  /**
   * Calculate and update officer performance metrics
   */
  static async updateOfficerMetrics() {
    try {
      const officers = await Officer.find({ isActive: true });

      for (const officer of officers) {
        const complaints = await Complaint.find({ assignedOfficer: officer._id });

        if (complaints.length > 0) {
          const resolved = complaints.filter(c => c.status === 'resolved').length;
          const totalTime = complaints
            .filter(c => c.resolvedAt)
            .reduce((sum, c) => {
              const days = (c.resolvedAt - c.createdAt) / (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0);

          officer.resolvedCount = resolved;
          officer.averageResolutionTime = complaints.filter(c => c.resolvedAt).length
            ? (totalTime / complaints.filter(c => c.resolvedAt).length).toFixed(2)
            : 0;

          // Calculate performance rating based on resolution rate and time
          const resolutionRate = (resolved / complaints.length) * 100;
          const timeScore = Math.max(0, 5 - officer.averageResolutionTime / 10);
          officer.performanceRating = ((resolutionRate / 100) * 3 + timeScore * 2) / 5;

          await officer.save();
        }
      }

      console.log(`Updated metrics for ${officers.length} officers`);
    } catch (error) {
      console.error('Error updating officer metrics:', error);
      throw error;
    }
  }

  /**
   * Auto-close resolved complaints after no activity for X days
   */
  static async autoCloseResolvedComplaints(daysBeforeClose = 7) {
    try {
      const thresholdDate = new Date(Date.now() - daysBeforeClose * 24 * 60 * 60 * 1000);

      const resolvedComplaints = await Complaint.find({
        status: 'resolved',
        resolvedAt: { $lt: thresholdDate },
      });

      let closedCount = 0;

      for (const complaint of resolvedComplaints) {
        complaint.status = 'closed';
        complaint.statusHistory.push({
          status: 'closed',
          comment: `Automatically closed after ${daysBeforeClose} days of resolution`,
          timestamp: new Date(),
        });
        await complaint.save();
        closedCount++;
      }

      console.log(`Auto-closed ${closedCount} resolved complaints`);
      return closedCount;
    } catch (error) {
      console.error('Error auto-closing complaints:', error);
      throw error;
    }
  }
}

export default ComplaintRoutingBot;
