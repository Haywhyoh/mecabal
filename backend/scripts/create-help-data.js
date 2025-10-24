const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNGJhOTg4Ni1jZTMwLTQzZWEtOWFjMC03Y2E0NWU0NTU3MGYiLCJ1c2VySWQiOiJhNGJhOTg4Ni1jZTMwLTQzZWEtOWFjMC03Y2E0NWU0NTU3MGYiLCJlbWFpbCI6ImF5b0Bjb2RlbXlnaWcuY29tIiwicGhvbmVOdW1iZXIiOiIrMjM0ODE0MjM2NDQ3NCIsInNlc3Npb25JZCI6IjBhZGU0MmZiLWU3NzAtNGZkYS1hOGRkLTQ5YjdlMzc2NWQwNyIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjAzODA5OTUsImV4cCI6MTc2MDQ2NzM5NX0.oE4O62WkJUlnBXkefWy3PxA1WAwM60HqCRjCs9CWE8w';

const helpPosts = [
  {
    content: "Can someone help me pick up my package from the gate? I'm at work and won't be home until 6 PM. The package is from Jumia and should be delivered around 2 PM. I'll pay 500 naira for the help!",
    postType: "help",
    helpCategory: "errand",
    urgency: "medium",
    budget: "500 naira",
    privacyLevel: "neighborhood"
  },
  {
    content: "I need help moving my furniture this Saturday. I'm relocating to a new apartment in the same estate. Need 2-3 strong people to help move a sofa, dining table, and some boxes. Will provide refreshments and pay 2000 naira per person.",
    postType: "help",
    helpCategory: "task",
    urgency: "high",
    budget: "2000 naira per person",
    taskType: "moving",
    estimatedDuration: "3-4 hours",
    privacyLevel: "neighborhood"
  },
  {
    content: "Looking to borrow a pressure washer for the weekend. Need to clean my compound and car. Will return it in good condition on Sunday evening. Can provide a small deposit if needed.",
    postType: "help",
    helpCategory: "borrow",
    urgency: "low",
    borrowItem: "Pressure washer",
    borrowDuration: "weekend",
    itemCondition: "Prefer one in good working condition",
    privacyLevel: "neighborhood"
  },
  {
    content: "Can anyone recommend a good plumber in the estate? My kitchen sink is leaking and I need someone reliable and affordable. Preferably someone who has worked in our estate before.",
    postType: "help",
    helpCategory: "recommendation",
    urgency: "medium",
    privacyLevel: "neighborhood"
  },
  {
    content: "How do I deal with persistent mosquitoes in my apartment? I've tried mosquito nets and sprays but they keep coming back. Any effective home remedies or professional solutions?",
    postType: "help",
    helpCategory: "advice",
    urgency: "low",
    privacyLevel: "neighborhood"
  },
  {
    content: "Need someone to walk my dog for a week while I'm traveling for work. My dog is friendly and well-behaved. Will pay 1000 naira per day. Must be available morning and evening.",
    postType: "help",
    helpCategory: "task",
    urgency: "medium",
    budget: "1000 naira per day",
    taskType: "delivery",
    estimatedDuration: "30 minutes twice daily",
    privacyLevel: "neighborhood"
  },
  {
    content: "Can someone help me pick up groceries from Shoprite? I'm feeling unwell and can't go out. Will send the list and money via bank transfer. Will pay 300 naira for delivery.",
    postType: "help",
    helpCategory: "errand",
    urgency: "medium",
    budget: "300 naira",
    privacyLevel: "neighborhood"
  },
  {
    content: "Looking to borrow a ladder for the weekend. Need to clean my gutters and fix some lights. Will return it clean and in good condition on Sunday.",
    postType: "help",
    helpCategory: "borrow",
    urgency: "low",
    borrowItem: "Ladder",
    borrowDuration: "weekend",
    itemCondition: "Must be sturdy and safe",
    privacyLevel: "neighborhood"
  },
  {
    content: "Best place to buy fresh fish nearby? Looking for good quality fish for a family dinner. Any recommendations for reliable fish sellers in the area?",
    postType: "help",
    helpCategory: "recommendation",
    urgency: "low",
    privacyLevel: "neighborhood"
  },
  {
    content: "Tips for organizing estate security? We're having issues with security in our estate and I want to help improve it. Any suggestions for better security measures?",
    postType: "help",
    helpCategory: "advice",
    urgency: "medium",
    privacyLevel: "neighborhood"
  }
];

async function createHelpPosts() {
  console.log('🚀 Creating help posts...');
  
  // Try just the first post first
  for (let i = 0; i < 1; i++) {
    const post = helpPosts[i];
    try {
      console.log(`Creating post ${i + 1}/${helpPosts.length}: ${post.helpCategory}`);
      
      const response = await axios.post(`${API_BASE_URL}/posts`, post, {
        headers: {
          'Authorization': TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log(`✅ Post ${i + 1} created successfully: ${response.data.data.id}`);
      } else {
        console.log(`❌ Failed to create post ${i + 1}: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error creating post ${i + 1}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // Wait 1 second between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 Finished creating help posts!');
}

// Run the script
createHelpPosts().catch(console.error);
