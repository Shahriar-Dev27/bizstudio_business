import { MapPin } from "lucide-react";

const cities = [
  ["Sylhet", "73%", "top-[18%] right-[18%]"], ["Dhaka", "86%", "top-[45%] right-[33%]"],
  ["Rajshahi", "68%", "top-[36%] left-[16%]"], ["Khulna", "64%", "bottom-[18%] left-[30%]"],
  ["Chattogram", "79%", "bottom-[24%] right-[12%]"],
];

export function MapFallback() {
  return (
    <div className="relative h-full min-h-[430px] overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_55%_45%,#162044_0,#0b1125_45%,#070b16_78%)]" role="img" aria-label="Illustrated Bangladesh opportunity map with city markers">
      <div className="soft-grid absolute inset-0 opacity-50" /><div className="absolute left-1/2 top-1/2 h-[72%] w-[42%] -translate-x-1/2 -translate-y-1/2 rotate-[-7deg] rounded-[46%_54%_58%_42%/34%_38%_62%_66%] border-2 border-[#53e0ff]/55 bg-gradient-to-br from-[#6249d8] to-[#17284c] shadow-[inset_-18px_-12px_40px_rgba(0,0,0,.24),0_0_70px_rgba(83,224,255,.16)] before:absolute before:-bottom-4 before:right-5 before:h-28 before:w-16 before:rotate-[-22deg] before:rounded-[40%_60%_80%_20%] before:bg-[#23305e]" />
      {cities.map(([city, score, position]) => (
        <div key={city} className={`absolute ${position} z-10 flex items-center gap-2 rounded-full border border-[#53e0ff]/15 bg-[#08101f]/90 py-1.5 pl-1.5 pr-3 text-white shadow-xl backdrop-blur`}>
          <span className="grid size-8 place-items-center rounded-full bg-[#7c5cff] text-white"><MapPin size={15} aria-hidden="true" /></span>
          <span><span className="block text-xs font-bold leading-none">{city}</span><span className="text-[10px] font-semibold text-[#55e4b3]">Signal {score}</span></span>
        </div>
      ))}
      <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-[#08101f]/90 px-3 py-2 text-xs font-semibold text-[#9aa5bd] backdrop-blur">Illustrative opportunity signals</div>
    </div>
  );
}
