import "dotenv/config";
import { db } from "./db";
import { trails, waypoints } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create Chinatown Trail
  const [chinatownTrail] = await db
    .insert(trails)
    .values({
      name: "Chinatown Heritage Trail",
      description:
        "Journey through Singapore's historic Chinatown, from its origins as a coolie settlement to its transformation into a vibrant cultural district. Discover clan houses, temples, shophouses, and hawker centers.",
      neighborhood: "Chinatown",
      totalWaypoints: 10,
      estimatedDuration: 120,
      difficulty: "easy",
      heroImage:
        "https://images.unsplash.com/photo-1555217851-85cffffc8982?w=800",
    })
    .returning();

  // Create Sentosa Trail
  const [sentosaTrail] = await db
    .insert(trails)
    .values({
      name: "Sentosa: Military Fortress to Tourist Paradise",
      description:
        "Explore Sentosa's dramatic transformation from a military fortress to Southeast Asia's premier island resort. Walk through history at Fort Siloso and discover how this strategic outpost became a leisure destination.",
      neighborhood: "Sentosa",
      totalWaypoints: 10,
      estimatedDuration: 150,
      difficulty: "moderate",
      heroImage:
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800",
    })
    .returning();

  // Chinatown Waypoints
  const chinatownWaypoints = [
    {
      trailId: chinatownTrail.id,
      name: "Buddha Tooth Relic Temple",
      description:
        "This stunning Tang Dynasty-style temple houses what is believed to be Buddha's tooth relic. Built in 2007, it stands as a magnificent example of Buddhist architecture and cultural preservation in Singapore's Chinatown.",
      latitude: 1.2815,
      longitude: 103.844,
      orderIndex: 1,
      category: "Temple",
      heroImage:
        "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",
      historicalImage:
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
      modernImage:
        "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Temple Construction 2005-2007",
          description: "Archive photos of the temple's construction",
          url: "#",
          count: 12,
        },
        {
          type: "document",
          title: "Buddhist Heritage in Singapore",
          description: "Historical document about Buddhism in Chinatown",
          url: "#",
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Thian Hock Keng Temple",
      description:
        "Singapore's oldest Chinese temple, built in 1842 by Hokkien immigrants. This ornate temple dedicated to the sea goddess Mazu showcases traditional southern Chinese architecture and served as a place of thanksgiving for safe passage.",
      latitude: 1.2808,
      longitude: 103.8449,
      orderIndex: 2,
      category: "Temple",
      heroImage:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400",
      historicalImage:
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
      modernImage:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Thian Hock Keng 1900s",
          description: "Historical photographs from the early 1900s",
          url: "#",
          count: 8,
        },
        {
          type: "audio",
          title: "Oral History: Temple Keepers",
          description: "Stories from generations of temple keepers",
          url: "#",
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Chinatown Heritage Centre",
      description:
        "Step back in time to experience life in 1950s Chinatown. This living museum recreates the cramped conditions of the cubicle and shophouse tenements where Chinese immigrants once lived.",
      latitude: 1.2838,
      longitude: 103.8446,
      orderIndex: 3,
      category: "Museum",
      heroImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Life in 1950s Chinatown",
          description: "Photo collection of daily life",
          url: "#",
          count: 25,
        },
        {
          type: "document",
          title: "Immigration Records",
          description: "Chinese immigration documents",
          url: "#",
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Chinatown Street Market",
      description:
        "Browse through the vibrant street market selling traditional Chinese goods, souvenirs, and local delicacies. This bustling marketplace has been a Chinatown fixture for decades.",
      latitude: 1.2843,
      longitude: 103.8442,
      orderIndex: 4,
      category: "Market",
      heroImage:
        "https://images.unsplash.com/photo-1555217851-85cffffc8982?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Street Markets Through Decades",
          description: "Evolution of Chinatown markets",
          url: "#",
          count: 15,
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Sri Mariamman Temple",
      description:
        "Singapore's oldest Hindu temple, established in 1827. This Dravidian-style temple features an ornate gopuram adorned with colorful deities and has served the Hindu community for nearly two centuries.",
      latitude: 1.2828,
      longitude: 103.8452,
      orderIndex: 5,
      category: "Temple",
      heroImage:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Temple Restoration 1984",
          description: "Major restoration photos",
          url: "#",
          count: 10,
        },
        {
          type: "document",
          title: "Hindu Heritage in Chinatown",
          description: "Historical coexistence of cultures",
          url: "#",
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Telok Ayer Street Shophouses",
      description:
        "These beautifully preserved Peranakan shophouses showcase intricate tile work and ornate facades. Once the waterfront before land reclamation, this street was the first stop for new immigrants.",
      latitude: 1.2802,
      longitude: 103.8476,
      orderIndex: 6,
      category: "Architecture",
      heroImage:
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
      historicalImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      modernImage:
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Telok Ayer Waterfront 1900",
          description: "When this street met the sea",
          url: "#",
          count: 12,
        },
        {
          type: "map",
          title: "Land Reclamation Maps",
          description: "Showing coastal changes",
          url: "#",
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Clan Jetty Houses",
      description:
        "Historic wooden houses built on stilts, once home to Chinese clan associations. These structures represent the close-knit clan communities that formed the backbone of early Chinatown society.",
      latitude: 1.2795,
      longitude: 103.8465,
      orderIndex: 7,
      category: "Historical Site",
      heroImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Clan Associations",
          description: "Historical photos of clan houses",
          url: "#",
          count: 20,
        },
        {
          type: "audio",
          title: "Clan Elders Oral History",
          description: "Stories of clan communities",
          url: "#",
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Maxwell Food Centre",
      description:
        "One of Singapore's most famous hawker centers, established in 1986 on the site of the former Maxwell Market. Home to legendary food stalls serving authentic local cuisine.",
      latitude: 1.281,
      longitude: 103.8438,
      orderIndex: 8,
      category: "Hawker Center",
      heroImage:
        "https://images.unsplash.com/photo-1555217851-85cffffc8982?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Maxwell Market History",
          description: "From wet market to hawker center",
          url: "#",
          count: 15,
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Chinatown Complex",
      description:
        "Singapore's largest hawker center and wet market complex. This iconic building represents the government's efforts to organize and preserve traditional food culture in modern housing estates.",
      latitude: 1.2825,
      longitude: 103.843,
      orderIndex: 9,
      category: "Hawker Center",
      heroImage:
        "https://images.unsplash.com/photo-1555217851-85cffffc8982?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "From Street Hawkers to Complex",
          description: "Evolution of hawker culture",
          url: "#",
          count: 18,
        },
      ],
    },
    {
      trailId: chinatownTrail.id,
      name: "Sago Lane (Death Houses)",
      description:
        "Once known as 'Death House Lane,' this street was lined with Chinese funeral parlors and hospices. Today, it's a quiet reminder of Chinatown's complex history and cultural traditions.",
      latitude: 1.2795,
      longitude: 103.8435,
      orderIndex: 10,
      category: "Historical Site",
      heroImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Sago Lane in the 1960s",
          description: "Documentary photos of funeral houses",
          url: "#",
          count: 14,
        },
        {
          type: "audio",
          title: "Death House Stories",
          description: "Oral histories of funeral traditions",
          url: "#",
        },
      ],
    },
  ];

  // Sentosa Waypoints
  const sentosaWaypoints = [
    {
      trailId: sentosaTrail.id,
      name: "Fort Siloso",
      description:
        "Built in the 1880s to guard Singapore's western entrance, Fort Siloso is the only preserved coastal artillery battery. It played a crucial role in Singapore's defense and now serves as a military museum.",
      latitude: 1.2565,
      longitude: 103.8089,
      orderIndex: 1,
      category: "Military Heritage",
      heroImage:
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=400",
      historicalImage:
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
      modernImage:
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Fort Construction 1880s",
          description: "British colonial fortification photos",
          url: "#",
          count: 16,
        },
        {
          type: "document",
          title: "WWII Defense Strategy",
          description: "Military records and plans",
          url: "#",
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Palawan Beach",
      description:
        "Named after the WW2 SS Palawan shipwreck, this family-friendly beach features the iconic suspension bridge to 'Asia's Southernmost Point' (continental). Once a military area, now a popular recreational spot.",
      latitude: 1.2508,
      longitude: 103.8292,
      orderIndex: 2,
      category: "Beach",
      heroImage:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Sentosa Beaches Transformation",
          description: "From military zone to tourist paradise",
          url: "#",
          count: 22,
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Siloso Beach",
      description:
        "Once part of the military defense system, Siloso Beach now hosts beach volleyball, water sports, and vibrant beach bars. The transformation represents Sentosa's journey from fortress to fun.",
      latitude: 1.258,
      longitude: 103.812,
      orderIndex: 3,
      category: "Beach",
      heroImage:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Military Beach to Recreation",
          description: "Siloso's transformation",
          url: "#",
          count: 18,
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Sentosa Cable Car Station",
      description:
        "The iconic cable car system, opened in 1974, connected Sentosa to mainland Singapore and marked the beginning of its tourism era. The sky-high journey offers stunning harbor views.",
      latitude: 1.2612,
      longitude: 103.8186,
      orderIndex: 4,
      category: "Transportation",
      heroImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      historicalImage:
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
      modernImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Cable Car Opening 1974",
          description: "Historic opening ceremony",
          url: "#",
          count: 12,
        },
        {
          type: "document",
          title: "Tourism Development Plans",
          description: "Government tourism strategy",
          url: "#",
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Images of Singapore LIVE",
      description:
        "Located at the historic Fort Siloso, this attraction brings Singapore's history to life through immersive experiences and wax figures, telling stories from the colonial era to modern times.",
      latitude: 1.257,
      longitude: 103.8095,
      orderIndex: 5,
      category: "Museum",
      heroImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Singapore Through Decades",
          description: "Historical photo collection",
          url: "#",
          count: 35,
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Sentosa Nature Discovery",
      description:
        "This coastal forest and rocky shore showcase Sentosa's natural heritage. Once cleared for military purposes, the island's nature has been carefully restored and preserved.",
      latitude: 1.2545,
      longitude: 103.815,
      orderIndex: 6,
      category: "Nature",
      heroImage:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Sentosa's Natural Environment",
          description: "Flora and fauna documentation",
          url: "#",
          count: 20,
        },
        {
          type: "document",
          title: "Environmental Studies",
          description: "Ecological surveys and reports",
          url: "#",
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Tanjong Beach",
      description:
        "The most tranquil of Sentosa's beaches, Tanjong Beach evolved from a restricted military zone to an upscale beach club destination, symbolizing the island's luxury resort transformation.",
      latitude: 1.2465,
      longitude: 103.8335,
      orderIndex: 7,
      category: "Beach",
      heroImage:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Tanjong Beach Evolution",
          description: "From restricted to resort",
          url: "#",
          count: 16,
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Sentosa Boardwalk",
      description:
        "Opened in 2011, this scenic walkway connects mainland Singapore to Sentosa, offering a free alternative to the cable car and monorail. It represents modern eco-friendly access to the island.",
      latitude: 1.259,
      longitude: 103.8215,
      orderIndex: 8,
      category: "Infrastructure",
      heroImage:
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Boardwalk Construction 2011",
          description: "Modern infrastructure development",
          url: "#",
          count: 10,
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Sentosa Cove",
      description:
        "Singapore's only integrated marina residential community, developed in the 2000s. This exclusive waterfront enclave represents Sentosa's transformation into a world-class residential and leisure destination.",
      latitude: 1.245,
      longitude: 103.8445,
      orderIndex: 9,
      category: "Development",
      heroImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "Sentosa Cove Development",
          description: "From concept to completion",
          url: "#",
          count: 25,
        },
        {
          type: "document",
          title: "Urban Development Plans",
          description: "Master planning documents",
          url: "#",
        },
      ],
    },
    {
      trailId: sentosaTrail.id,
      name: "Resorts World Sentosa",
      description:
        "Opened in 2010, this integrated resort marked Sentosa's pinnacle as a tourist destination. From military outpost to Southeast Asia's premier entertainment hub - a complete transformation.",
      latitude: 1.2565,
      longitude: 103.82,
      orderIndex: 10,
      category: "Resort",
      heroImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      historicalImage:
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
      modernImage:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400",
      nlbResources: [
        {
          type: "photograph",
          title: "RWS Construction 2006-2010",
          description: "Mega development timeline",
          url: "#",
          count: 30,
        },
        {
          type: "document",
          title: "Tourism Economic Impact",
          description: "Economic transformation study",
          url: "#",
        },
      ],
    },
  ];

  await db.insert(waypoints).values(chinatownWaypoints);
  await db.insert(waypoints).values(sentosaWaypoints);

  console.log("✅ Seeding completed!");
  console.log(
    `Created trails: Chinatown (${chinatownWaypoints.length} waypoints), Sentosa (${sentosaWaypoints.length} waypoints)`
  );

  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
