const mongoose = require("mongoose");
const Application = require("../models/Application");
const ProofSubmission = require("../models/ProofSubmission");

const submitProof = async (req, res) => {
  try {
    const { applicationId, proofUrl, profileLink, notes, phone, secondaryLink } = req.body;
    const resolvedProofUrl = profileLink || proofUrl;

    if (!applicationId || !resolvedProofUrl) {
      return res.status(400).json({
        message: "applicationId and profileLink are required.",
      });
    }

    if (!notes || !String(notes).trim()) {
      return res.status(400).json({
        message: "Notes are required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Screenshot is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    const application = await Application.findById(applicationId).populate("campaign");

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (application.influencer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can submit proof only for your own application.",
      });
    }

    if (application.status !== "accepted") {
      return res.status(400).json({
        message: "Proof can be submitted only when application status is accepted.",
      });
    }

    const existingProof = await ProofSubmission.findOne({ application: applicationId });

    if (existingProof) {
      return res.status(409).json({
        message: "Proof already submitted for this application.",
      });
    }

    const proof = await ProofSubmission.create({
      application: applicationId,
      proofUrl: String(resolvedProofUrl).trim(),
      screenshotUrl: req.file ? `/uploads/proofs/${req.file.filename}` : "",
      notes: notes ? String(notes).trim() : "",
      phone: phone ? String(phone).trim() : "",
      secondaryLink: secondaryLink ? String(secondaryLink).trim() : "",
    });

    application.status = "proof_submitted";
    await application.save();

    return res.status(201).json({
      message: "Proof submitted successfully.",
      proof,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "Proof already submitted for this application.",
      });
    }

    return res.status(500).json({
      message: "Server error while submitting proof.",
    });
  }
};

const getMyProofs = async (req, res) => {
  try {
    const myApplications = await Application.find({ influencer: req.user.id }).select(
      "_id campaign status"
    );

    const applicationIds = myApplications.map((item) => item._id);

    const proofs = await ProofSubmission.find({
      application: { $in: applicationIds },
    })
      .populate({
        path: "application",
        populate: {
          path: "campaign",
          select: "title category platform status",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ proofs });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching your proofs.",
    });
  }
};

const getProofForApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    const application = await Application.findById(applicationId).populate("campaign");

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (!application.campaign || application.campaign.company.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only view proofs for your own campaign applications.",
      });
    }

    const proof = await ProofSubmission.findOne({ application: applicationId })
      .populate("reviewedBy", "name email")
      .populate({
        path: "application",
        populate: [
          { path: "campaign", select: "title status" },
          { path: "influencer", select: "name email role" },
        ],
      });

    if (!proof) {
      return res.status(404).json({ message: "Proof not found for this application." });
    }

    return res.status(200).json({ proof });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching proof details.",
    });
  }
};

const updateProofForApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { profileLink, proofUrl, notes, phone, secondaryLink } = req.body;
    const resolvedProofUrl = profileLink || proofUrl;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    if (!resolvedProofUrl) {
      return res.status(400).json({ message: "Profile link is required." });
    }

    if (!notes || !String(notes).trim()) {
      return res.status(400).json({ message: "Notes are required." });
    }

    const application = await Application.findById(applicationId).populate("campaign");

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (application.influencer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can edit proof only for your own application.",
      });
    }

    const proof = await ProofSubmission.findOne({ application: applicationId });

    if (!proof) {
      return res.status(404).json({ message: "Proof not found for this application." });
    }

    if (proof.approvalStatus !== "pending") {
      return res.status(400).json({
        message: "Proof can only be edited while review is pending.",
      });
    }

    if (!req.file && !proof.screenshotUrl) {
      return res.status(400).json({ message: "Screenshot is required." });
    }

    proof.proofUrl = String(resolvedProofUrl).trim();
    proof.notes = String(notes).trim();
    proof.phone = phone ? String(phone).trim() : "";
    proof.secondaryLink = secondaryLink ? String(secondaryLink).trim() : "";
    if (req.file) {
      proof.screenshotUrl = `/uploads/proofs/${req.file.filename}`;
    }

    await proof.save();

    return res.status(200).json({
      message: "Proof updated successfully.",
      proof,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while updating proof." });
  }
};

module.exports = {
  submitProof,
  getMyProofs,
  getProofForApplication,
  updateProofForApplication,
};
