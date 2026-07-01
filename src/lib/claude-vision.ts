import * as Sentry from "@sentry/nextjs";

export interface AiProductDescription {
  productName: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  category: string;
  subcategory: string;
  confidenceNote: string;
}

/**
 * Generates an AI product description from a set of image URLs.
 * Integrates with Groq/Llama or Claude, and falls back to a realistic mock if no keys are found.
 */
export async function generateProductDescription(
  imageUrls: string[],
  keywords: string[] = []
): Promise<AiProductDescription> {
  const apiKey =
    process.env.GROQ_API_KEY ||
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    "";
  const modelName = process.env.AI_MODEL_NAME || "meta-llama/llama-4-scout-17b-16e-instruct";

  const systemPrompt = `You are a fashion product copywriter for Velvet Lane, an Indian fashion marketplace serving Gen Z women in Chennai. Analyze the provided product images and write a compelling, ACCURATE listing. Never invent fabric, color, or design details not clearly visible in the images. Respond ONLY with valid JSON matching this exact schema: { productName: string, shortDescription: string (max 150 chars), fullDescription: string (4-6 sentences covering fabric, occasion, styling, care), tags: string[] (max 10), suggestedPriceMin: number, suggestedPriceMax: number, category: string, subcategory: string, confidenceNote: string (one sentence on what's uncertain, or empty string if confident) }`;

  // 1. Check if we should use Mock Fallback
  if (!apiKey || apiKey.includes("mock") || apiKey === "") {
    console.log("[AI VISION MOCK] Generating copy from images:", imageUrls);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Try to guess a style based on keywords
    const isStreetwear = keywords.some((k) =>
      ["street", "casual", "oversized", "tee", "hoodie", "cargo"].some(
        (w) => k.toLowerCase().includes(w)
      )
    );
    const isAccessory = keywords.some((k) =>
      ["bag", "jewelry", "earring", "necklace", "ring", "clutch"].some(
        (w) => k.toLowerCase().includes(w)
      )
    );

    if (isStreetwear) {
      return {
        productName: "Gen Z Oversized Graphic Tee",
        shortDescription: "Oversized fit heavyweight cotton graphic tee in street style.",
        fullDescription: "Premium 240 GSM French terry cotton fabric, offering extreme comfort and structured drape. Styled with a bold Chennai cyber-punk graphic print on the back. Perfect for streetwear styling and daily casual hangouts. Machine wash cold with similar colors.",
        tags: ["streetwear", "graphic-tee", "oversized", "unisex", "chennai-street"],
        suggestedPriceMin: 89900, // ₹899 in paise
        suggestedPriceMax: 149900, // ₹1499 in paise
        category: "Streetwear",
        subcategory: "T-Shirts",
        confidenceNote: "",
      };
    } else if (isAccessory) {
      return {
        productName: "Handcrafted Beaded Jhumkas",
        shortDescription: "Statement glass-beaded jhumkas in vibrant local festival tones.",
        fullDescription: "Delicately handcrafted using premium alloy metals and premium polished glass beads. Feature a double-layered dome drop hanging gracefully. Perfect accent for sarees, salwars, or fusion clothing during festive events. Avoid direct contact with perfume and moisture.",
        tags: ["accessories", "jewelry", "jhumkas", "handcrafted", "festive"],
        suggestedPriceMin: 39900, // ₹399 in paise
        suggestedPriceMax: 69900, // ₹699 in paise
        category: "Accessories",
        subcategory: "Jewelry",
        confidenceNote: "",
      };
    } else {
      // Default to Ethnic Saree (Very popular)
      return {
        productName: "Chanderi Cotton Silk Saree",
        shortDescription: "Vibrant Chanderi cotton-silk blend saree with zari border.",
        fullDescription: "Crafted from a premium blend of Chanderi cotton and pure mulberry silk for a lightweight, breathable feel. Features a traditional gold zari weave border and floral motifs on the pallu. Ideal for summer weddings, temple visits, and family celebrations. Dry clean recommended to preserve fabric texture.",
        tags: ["handloom", "saree", "ethnic-wear", "chanderi", "chennai-wedding"],
        suggestedPriceMin: 220000, // ₹2200 in paise
        suggestedPriceMax: 350000, // ₹3500 in paise
        category: "Women's Ethnic Wear",
        subcategory: "Sarees",
        confidenceNote: "",
      };
    }
  }

  // 2. Call real AI API
  try {
    const isGroq = process.env.GROQ_API_KEY !== undefined;
    const url = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";

    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let body: any;

    if (isGroq) {
      headers["Authorization"] = `Bearer ${process.env.GROQ_API_KEY}`;
      
      const contentArray: any[] = [
        { type: "text", text: `Please analyze these images and generate the product copy. ${keywords.length > 0 ? `Keywords provided: ${keywords.join(", ")}.` : ""}` }
      ];

      imageUrls.forEach((imgUrl) => {
        contentArray.push({
          type: "image_url",
          image_url: { url: imgUrl }
        });
      });

      body = {
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentArray }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      };
    } else {
      // Anthropic Claude vision API
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      
      // Note: Claude expects base64 images usually, or image urls if using standard proxy.
      // Since standard Claude API doesn't accept image URLs directly, we'd need to base64-encode them.
      // But we can construct the payload using the standard anthropic messages shape.
      const contentArray: any[] = [];
      imageUrls.forEach((imgUrl) => {
        contentArray.push({
          type: "image",
          source: {
            type: "url", // assuming proxy/gateway support, else fallback to standard URLs
            url: imgUrl
          }
        });
      });

      contentArray.push({
        type: "text",
        text: `Strictly generate a JSON object matching the requested schema. Keywords: ${keywords.join(", ")}`
      });

      body = {
        model: modelName,
        system: systemPrompt,
        messages: [{ role: "user", content: contentArray }],
        max_tokens: 1000,
        temperature: 0.2
      };
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 12000); // Allow 12s for the API fetch to trigger within action's 15s window

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    let jsonText = "";

    if (isGroq) {
      jsonText = data.choices?.[0]?.message?.content || "{}";
    } else {
      jsonText = data.content?.[0]?.text || "{}";
    }

    const parsed: AiProductDescription = JSON.parse(jsonText);
    
    // Ensure numeric bounds/defaults on suggested prices (to prevent NaN/null issues)
    parsed.suggestedPriceMin = Number(parsed.suggestedPriceMin) || 10000;
    parsed.suggestedPriceMax = Number(parsed.suggestedPriceMax) || 20000;

    return parsed;
  } catch (error) {
    Sentry.captureException(error);
    console.error("[AI Vision Generation Error]:", error);
    throw error;
  }
}
