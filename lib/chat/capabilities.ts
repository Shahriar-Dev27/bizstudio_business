import type { AdvisorRequest } from "@/types/chat";
import { isRoadmapRequest } from "./roadmap";
/** Direct capability limits use server-owned copy: no live research tool exists. */
export function capabilityResponse(input:AdvisorRequest):string|null{
 const question=input.messages.at(-1)?.content||"";
 if(input.mode==="roadmap"||isRoadmapRequest(question))return null;
 const bangla=input.profile?.language==="bn"||/[\u0980-\u09ff]/.test(question);
 if(/guarantee(?:d)?.{0,70}(?:profit|return)|(?:profit|return).{0,40}guarantee|নিশ্চিত.{0,35}লাভ|লাভ.{0,35}নিশ্চিত/i.test(question))return bangla?
  "ব্যবসায় নিশ্চিত লাভের প্রতিশ্রুতি দেওয়া যায় না। চাহিদা, খরচ ও ক্রেতার পুনরায় কেনার তথ্য এখনও অজানা হলে লাভের হার বানিয়ে বলা ঠিক হবে না।\n\n**পরের পদক্ষেপ:** অল্প পরিমাণে একটি বিক্রির পরীক্ষা করুন। প্রকৃত বিক্রয় আয়, সব খরচ এবং ক্রেতার প্রতিক্রিয়া লিখে রাখুন। এই তথ্য দিয়ে সম্ভাব্য লাভ–ক্ষতির হিসাব করা যাবে।":
  "A business cannot promise guaranteed profits. Without observed demand and costs, I cannot give a reliable return or a typical profit benchmark.\n\n**Next action:** run one small paid pilot. Record actual revenue, all costs and customer feedback, then calculate a scenario from those figures before committing more money.";
 const invented=/(?:invent|fabricat|fake).{0,90}(?:source|citation|government|url)/i.test(question);
 const regulation=/\blicen[cs]|\bvat\b|\btax\b|legal exemption|registration fee|লাইসেন্স|ভ্যাট|করহার|নিবন্ধন.{0,20}ফি|অনুমোদন/i.test(question);
 if(invented||regulation)return bangla?
  "বর্তমান নিয়ম, ফি বা লাইসেন্স থেকে ছাড়ের বিষয়টি এখানে যাচাই করা সম্ভব নয়। যাচাই ছাড়া ‘লাইসেন্স লাগে না’ বা নির্দিষ্ট নিয়ম নিশ্চিত করে বলব না; কোনো সূত্রও বানাব না।\n\n**যাচাইয়ের কাজ:**\n1. আপনার এলাকা, কী পণ্য বিক্রি করবেন এবং বাসা/অনলাইন/দোকান—এই তথ্য লিখুন।\n2. স্থানীয় লাইসেন্স দপ্তরকে জিজ্ঞাসা করুন কোন অনুমোদন ও কর্তৃপক্ষ আপনার ক্ষেত্রে প্রযোজ্য।\n3. বর্তমান লিখিত নির্দেশনা, তারিখ, প্রয়োজনীয় কাগজ ও ফি সংগ্রহ করুন। টাকা খরচের আগে অস্পষ্টতা নিশ্চিত করুন।\n\nসূত্রের লেখা দিলে তার ভিত্তিতে প্রশ্নের তালিকা তৈরি করতে সাহায্য করতে পারি; সেটিকে স্বাধীনভাবে যাচাই করা তথ্য বলব না।":
  "I cannot verify a current rule, fee or licensing exemption here, and I will not invent a source or assert that a test/home business is exempt.\n\n**Verification workflow:**\n1. Write down your location, exact activity and whether you will operate from home, online or a shop.\n2. Ask the relevant local licensing office which permissions and authorities apply to that activity.\n3. Obtain dated written requirements, documents and fees; clarify them before committing money.\n\nIf you provide the source text, I can help turn it into questions and checks, while clearly labelling that I have not independently verified it.";
 if(/live.{0,30}(?:market|rent|price)|exact.{0,30}(?:current|today).{0,30}(?:rent|price)|current.{0,20}(?:shop rent|rent for)/i.test(question))return bangla?
  "আমার কাছে সরাসরি বর্তমান বাজারদর বা ভাড়ার তথ্য নেই। নির্দিষ্ট দাম বানিয়ে বলব না। একই এলাকা ও একই ধরনের তিনটি সাম্প্রতিক লিখিত দর সংগ্রহ করুন; আকার, অগ্রিম, সেবা ও অতিরিক্ত খরচ একসঙ্গে তুলনা করুন।":
  "I do not have live market or rental access, so I cannot verify an exact current price. Collect three recent comparable quotes for your location, recording size, deposits, included services and extra costs. I can then help compare the figures you supply.";
 return null;
}
