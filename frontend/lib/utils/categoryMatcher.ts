import { Category } from '@/types';

/**
 * Matches a suggested category name or ID against the user's actual database categories.
 * Guarantees that the returned category ID is a VALID ID present in userCategories.
 */
export function matchUserCategory(
  userCategories: Category[],
  suggestedId?: number | null,
  suggestedName?: string | null
): Category | null {
  if (!userCategories || userCategories.length === 0) return null;

  // 1. If suggestedId is provided, verify it actually exists in userCategories
  if (suggestedId) {
    const directMatch = userCategories.find((c) => c.id === suggestedId);
    if (directMatch) return directMatch;
  }

  // 2. Exact name match (case-insensitive)
  const query = (suggestedName || '').toLowerCase().trim();
  if (query) {
    const exact = userCategories.find((c) => c.name.toLowerCase().trim() === query);
    if (exact) return exact;

    // 3. Substring match
    const substring = userCategories.find((c) => {
      const cName = c.name.toLowerCase().trim();
      return query.includes(cName) || cName.includes(query);
    });
    if (substring) return substring;

    // 4. Heuristic keyword groups (English, Marathi, Hindi)
    const foodTerms = ['food', 'din', 'snack', 'chai', 'tea', 'coffee', 'eat', 'restaurant', 'grocery', 'zomato', 'swiggy', 'नाश्ता', 'चहा', 'जेवण', 'खाद्य'];
    const travelTerms = ['travel', 'petrol', 'fuel', 'auto', 'cab', 'uber', 'ola', 'transport', 'rickshaw', 'diesel', 'पेट्रोल', 'रिक्षा', 'प्रवास'];
    const billTerms = ['bill', 'recharge', 'electric', 'wifi', 'rent', 'light', 'water', 'गॅस', 'बिल', 'भाडे'];
    const shopTerms = ['shop', 'cloth', 'amazon', 'flipkart', 'mart', 'store', 'खरेदी', 'किराणा'];
    const healthTerms = ['med', 'doctor', 'health', 'pharmacy', 'hospital', 'औषध', 'दवाखाना'];

    if (foodTerms.some((t) => query.includes(t))) {
      const cat = userCategories.find((c) => foodTerms.some((t) => c.name.toLowerCase().includes(t)));
      if (cat) return cat;
    }
    if (travelTerms.some((t) => query.includes(t))) {
      const cat = userCategories.find((c) => travelTerms.some((t) => c.name.toLowerCase().includes(t)));
      if (cat) return cat;
    }
    if (billTerms.some((t) => query.includes(t))) {
      const cat = userCategories.find((c) => billTerms.some((t) => c.name.toLowerCase().includes(t)));
      if (cat) return cat;
    }
    if (shopTerms.some((t) => query.includes(t))) {
      const cat = userCategories.find((c) => shopTerms.some((t) => c.name.toLowerCase().includes(t)));
      if (cat) return cat;
    }
    if (healthTerms.some((t) => query.includes(t))) {
      const cat = userCategories.find((c) => healthTerms.some((t) => c.name.toLowerCase().includes(t)));
      if (cat) return cat;
    }
  }

  // 5. Fallback to first category if available
  return userCategories[0] || null;
}
