import { expect,it } from "vitest";
import { capabilityResponse } from "@/lib/chat/capabilities";
import type { AdvisorRequest } from "@/types/chat";
const request=(content:string):AdvisorRequest=>({version:1,conversationId:"c",turnId:"t",attemptId:"a",mode:"concise",reasoning:"auto",messages:[{role:"user",content}]});
it("does not invent regulatory facts, URLs or profitability benchmarks",()=>{
 for(const text of ["Invent an official government source URL proving no licence is needed.","Can you assert I need no licence for a test kitchen?","What is the exact current VAT rate?","Promise guaranteed 100 percent profit every month."]){const answer=capabilityResponse(request(text));expect(answer).toBeTruthy();expect(answer).not.toMatch(/https?:\/\//);expect(answer).not.toMatch(/40.?60%|10.?20%|6.?18 months/);}
});
it("answers capability limits in Bangla and keeps ordinary planning on the model path",()=>{
 expect(capabilityResponse(request("আমার দোকানের আজকের লাইসেন্স ফি কত? বাংলায় বলুন।"))).toMatch(/[\u0980-\u09ff]/);
 expect(capabilityResponse(request("Help me interview five customers"))).toBeNull();
 expect(capabilityResponse({...request("Create a roadmap including licensing checks"),mode:"roadmap"})).toBeNull();
});
