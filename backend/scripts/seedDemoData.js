const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const CompanyProfile = require("../models/CompanyProfile");
const InfluencerProfile = require("../models/InfluencerProfile");
const Campaign = require("../models/Campaign");
const Application = require("../models/Application");
const ProofSubmission = require("../models/ProofSubmission");

dotenv.config();

const DEMO_EMAILS = [
  "demo.company@matchmint.com",
  "demo.influencer1@matchmint.com",
  "demo.influencer2@matchmint.com",
];

const cleanExistingDemoData = async () => {
  const existingUsers = await User.find({ email: { $in: DEMO_EMAILS } }).select("_id");
  const userIds = existingUsers.map((item) => item._id);

  if (userIds.length === 0) {
    return;
  }

  const demoCampaigns = await Campaign.find({ company: { $in: userIds } }).select("_id");
  const campaignIds = demoCampaigns.map((item) => item._id);

  const demoApplications = await Application.find({
    $or: [
      { influencer: { $in: userIds } },
      { campaign: { $in: campaignIds } },
    ],
  }).select("_id");
  const applicationIds = demoApplications.map((item) => item._id);

  await ProofSubmission.deleteMany({ application: { $in: applicationIds } });
  await Application.deleteMany({ _id: { $in: applicationIds } });
  await Campaign.deleteMany({ _id: { $in: campaignIds } });
  await CompanyProfile.deleteMany({ user: { $in: userIds } });
  await InfluencerProfile.deleteMany({ user: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required in backend/.env before seeding.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for seeding");

  await cleanExistingDemoData();

  const hashedPassword = await bcrypt.hash("123456", 10);

  const companyUser = await User.create({
    name: "Demo Company",
    email: "demo.company@matchmint.com",
    password: hashedPassword,
    role: "company",
  });

  const influencerUser1 = await User.create({
    name: "Demo Influencer One",
    email: "demo.influencer1@matchmint.com",
    password: hashedPassword,
    role: "influencer",
  });

  const influencerUser2 = await User.create({
    name: "Demo Influencer Two",
    email: "demo.influencer2@matchmint.com",
    password: hashedPassword,
    role: "influencer",
  });

  await CompanyProfile.create({
    user: companyUser._id,
    companyName: "MatchMint Demo Labs",
    category: "tech",
    contactEmail: "demo.company@matchmint.com",
    website: "https://matchmint.demo",
    description: "Demo company profile for viva and final project showcase.",
  });

  await InfluencerProfile.create([
    {
      user: influencerUser1._id,
      fullName: "Ava Creator",
      niches: ["tech", "education"],
      platforms: ["Instagram", "YouTube"],
      audienceSize: 42000,
      bio: "Tech educator and short-form content creator.",
    },
    {
      user: influencerUser2._id,
      fullName: "Noah Maker",
      niches: ["tech", "productivity"],
      platforms: ["Instagram", "LinkedIn"],
      audienceSize: 21000,
      bio: "Creator focused on creator tools and productivity workflows.",
    },
  ]);

  const today = new Date();
  const in15Days = new Date(today);
  in15Days.setDate(today.getDate() + 15);

  const in45Days = new Date(today);
  in45Days.setDate(today.getDate() + 45);

  const in20Days = new Date(today);
  in20Days.setDate(today.getDate() + 20);

  const in60Days = new Date(today);
  in60Days.setDate(today.getDate() + 60);

  const [campaign1, campaign2] = await Campaign.create([
    {
      company: companyUser._id,
      title: "[DEMO] Product Launch Reels",
      description: "Need launch reels and one story sequence for product reveal.",
      category: "tech",
      platform: "Instagram",
      budgetMin: 1000,
      budgetMax: 9000,
      startDate: in15Days,
      endDate: in45Days,
      status: "published",
    },
    {
      company: companyUser._id,
      title: "[DEMO] Tutorial Video Collaboration",
      description: "Collaborate on tutorials and campaign explanation content.",
      category: "tech",
      platform: "YouTube",
      budgetMin: 3000,
      budgetMax: 15000,
      startDate: in20Days,
      endDate: in60Days,
      status: "published",
    },
  ]);

  const [application1, application2, application3] = await Application.create([
    {
      campaign: campaign1._id,
      influencer: influencerUser1._id,
      status: "proof_submitted",
      matchScore: 88,
    },
    {
      campaign: campaign1._id,
      influencer: influencerUser2._id,
      status: "paid_simulated",
      matchScore: 79,
    },
    {
      campaign: campaign2._id,
      influencer: influencerUser1._id,
      status: "completed",
      matchScore: 91,
    },
  ]);

  await ProofSubmission.create([
    {
      application: application1._id,
      proofUrl: "https://example.com/demo-proof-ava",
      screenshotUrl: "https://example.com/demo-shot-ava.png",
      notes: "Submitted demo proof for review.",
      approvalStatus: "pending",
    },
    {
      application: application2._id,
      proofUrl: "https://example.com/demo-proof-noah",
      screenshotUrl: "https://example.com/demo-shot-noah.png",
      notes: "Approved and moved to simulated payment.",
      approvalStatus: "approved",
      reviewNotes: "Looks good. Approved.",
      reviewedAt: new Date(),
      reviewedBy: companyUser._id,
    },
    {
      application: application3._id,
      proofUrl: "https://example.com/demo-proof-ava-completed",
      screenshotUrl: "https://example.com/demo-shot-ava-completed.png",
      notes: "Completed collaboration example.",
      approvalStatus: "approved",
      reviewNotes: "Completed successfully.",
      reviewedAt: new Date(),
      reviewedBy: companyUser._id,
    },
  ]);

  console.log("Seed complete.");
  console.log("Demo credentials (password for all): 123456");
  console.log("Company: demo.company@matchmint.com");
  console.log("Influencer 1: demo.influencer1@matchmint.com");
  console.log("Influencer 2: demo.influencer2@matchmint.com");
};

seed()
  .then(async () => {
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });
