const mongoose = require("mongoose");
const Application = require("../models/Application");
const Campaign = require("../models/Campaign");
const ProofSubmission = require("../models/ProofSubmission");
const Wallet = require("../models/Wallet");
const { updateWalletBalance, ensureWalletForUser } = require("./walletController");

const buildStatusCounts = (applications) => {
  const counts = {
    accepted: 0,
    skipped: 0,
    proof_submitted: 0,
    approved: 0,
    rejected: 0,
    ready_for_payment: 0,
    paid_simulated: 0,
    completed: 0,
  };

  for (const item of applications) {
    if (counts[item.status] !== undefined) {
      counts[item.status] += 1;
    }
  }

  return counts;
};

const reviewProof = async (req, res) => {
  try {
    const { applicationId, decision, reviewNotes } = req.body;

    if (!applicationId || !decision) {
      return res.status(400).json({
        message: "applicationId and decision are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({
        message: "decision must be approve or reject.",
      });
    }

    const application = await Application.findById(applicationId).populate("campaign");

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (!application.campaign || application.campaign.company.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can review proofs only for your own campaign applications.",
      });
    }

    const proof = await ProofSubmission.findOne({ application: applicationId });

    if (!proof) {
      return res.status(404).json({
        message: "Proof not found for this application.",
      });
    }

    if (application.status !== "proof_submitted") {
      return res.status(400).json({
        message: "Proof can be reviewed only when application status is proof_submitted.",
      });
    }

    if (proof.approvalStatus !== "pending") {
      return res.status(400).json({
        message: "This proof has already been reviewed.",
      });
    }

    proof.approvalStatus = decision === "approve" ? "approved" : "rejected";
    proof.reviewNotes = reviewNotes ? String(reviewNotes).trim() : "";
    proof.reviewedAt = new Date();
    proof.reviewedBy = req.user.id;

    application.status = decision === "approve" ? "approved" : "rejected";

    await proof.save();
    await application.save();

    return res.status(200).json({
      message:
        decision === "approve"
          ? "Proof approved and application marked approved."
          : "Proof rejected and application marked rejected.",
      proof,
      application,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while reviewing proof.",
    });
  }
};

const markReadyForPayment = async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    const application = await Application.findById(applicationId).populate("campaign");

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (!application.campaign || application.campaign.company.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can update payment status only for your own campaign applications.",
      });
    }

    if (application.status !== "approved") {
      return res.status(400).json({
        message: "Only approved applications can be marked ready for payment.",
      });
    }

    application.status = "ready_for_payment";
    await application.save();

    return res.status(200).json({
      message: "Application marked ready for payment.",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while marking ready for payment.",
    });
  }
};

const markAsPaidSimulated = async (req, res) => {
  try {
    const { applicationId, amount, companyFeedback } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    const application = await Application.findById(applicationId)
      .populate("campaign")
      .populate("influencer");

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (!application.campaign || application.campaign.company.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can update payment status only for your own campaign applications.",
      });
    }

    if (application.status !== "ready_for_payment") {
      return res.status(400).json({
        message: "Only ready_for_payment applications can be marked as paid.",
      });
    }
    // Validate amount
    const paymentAmount = Number(amount) || 0;
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ message: "Valid payment amount is required." });
    }

    // Get company wallet and influencer wallet
    const companyWallet = await ensureWalletForUser(application.campaign.company);
    const influencerWallet = await ensureWalletForUser(application.influencer._id);

    // Check if company has sufficient balance
    if (companyWallet.balance < paymentAmount) {
      return res.status(400).json({
        message: "Insufficient balance in company wallet.",
      });
    }

    try {
      // Deduct from company wallet

      const debitTx = await updateWalletBalance(
        companyWallet._id,
        paymentAmount,
        "debit",
        `Payment for influencer: ${application.influencer.name}`,
        applicationId
      );

      // Credit to influencer wallet
      const creditTx = await updateWalletBalance(
        influencerWallet._id,
        paymentAmount,
        "credit",
        `Payment received from campaign: ${application.campaign.title}`,
        applicationId
      );

      application.status = "paid_simulated";
      application.paymentInfo = {
        amount: paymentAmount,
        companyFeedback: companyFeedback ? String(companyFeedback).trim() : "",
        paidBy: req.user.id,
        paidTo: application.influencer._id,
        paidAt: new Date(),
        transactionIds: [debitTx.transaction._id, creditTx.transaction._id],
        rejected: false,
      };

      await application.save();

      return res.status(200).json({
        message: "Application marked as paid (simulated) and wallets updated.",
        application,
      });
    } catch (walletError) {
      return res.status(500).json({
        message: "Error updating wallets: " + walletError.message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Server error while marking paid.",
    });
  }
};

  const rejectPaymentByCompany = async (req, res) => {
    try {
      const { applicationId, companyFeedback } = req.body;

      if (!applicationId) {
        return res.status(400).json({ message: "applicationId is required." });
      }

      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        return res.status(400).json({ message: "Invalid application id." });
      }

      const application = await Application.findById(applicationId).populate("campaign");

      if (!application) {
        return res.status(404).json({ message: "Application not found." });
      }

      if (!application.campaign || application.campaign.company.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You can update payment status only for your own campaign applications.",
        });
      }

      if (application.status !== "ready_for_payment") {
        return res.status(400).json({
          message: "Only ready_for_payment applications can be rejected by company.",
        });
      }

      application.status = "rejected";
      application.paymentInfo = {
        amount: 0,
        companyFeedback: companyFeedback ? String(companyFeedback).trim() : "",
        paidBy: req.user.id,
        paidTo: application.influencer._id,
        paidAt: new Date(),
        transactionIds: [],
        rejected: true,
      };

      await application.save();

      return res.status(200).json({
        message: "Application rejected by company for payment.",
        application,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error while rejecting payment." });
    }
  };

const markCompleted = async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    const application = await Application.findById(applicationId).populate("campaign");

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    const isCompanyOwner =
      application.campaign && application.campaign.company.toString() === req.user.id;
    const isInfluencerOwner = application.influencer.toString() === req.user.id;

    if (!isCompanyOwner && !isInfluencerOwner) {
      return res.status(403).json({
        message: "You can update completion only for your own application workflow.",
      });
    }

    if (application.status !== "paid_simulated") {
      return res.status(400).json({
        message: "Only paid_simulated applications can be marked completed.",
      });
    }

    application.status = "completed";
    await application.save();

    return res.status(200).json({
      message: "Application marked completed.",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while marking completed.",
    });
  }
};

const submitReadyForPaymentByInfluencer = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { contentLink, description } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    if (!contentLink || !contentLink.trim()) {
      return res.status(400).json({ message: "Content link is required." });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (application.influencer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only submit ready for payment for your own applications.",
      });
    }

    if (application.status !== "approved") {
      return res.status(400).json({
        message: "Only approved applications can be marked ready for payment.",
      });
    }

    application.status = "ready_for_payment";
    application.readyForPaymentData = {
      contentLink: contentLink.trim(),
      description: description ? String(description).trim() : "",
      submittedAt: new Date(),
    };

    await application.save();

    return res.status(200).json({
      message: "Application marked ready for payment.",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while marking ready for payment.",
    });
  }
};

const getCompanyPipelineStats = async (req, res) => {
  try {
    const companyCampaigns = await Campaign.find({ company: req.user.id }).select("_id");
    const campaignIds = companyCampaigns.map((item) => item._id);

    const applications = await Application.find({
      campaign: { $in: campaignIds },
    })
      .populate("campaign", "title status")
      .populate("influencer", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      total: applications.length,
      counts: buildStatusCounts(applications),
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching company pipeline stats.",
    });
  }
};

const getInfluencerPipelineStats = async (req, res) => {
  try {
    const applications = await Application.find({ influencer: req.user.id })
      .populate("campaign", "title status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      total: applications.length,
      counts: buildStatusCounts(applications),
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching influencer pipeline stats.",
    });
  }
};

module.exports = {
  reviewProof,
  markReadyForPayment,
  markAsPaidSimulated,
  rejectPaymentByCompany,
  markCompleted,
  submitReadyForPaymentByInfluencer,
  getCompanyPipelineStats,
  getInfluencerPipelineStats,
};
