export type ChallanExplainResult = {
  title: string;
  simpleHindi: string[];
  canDisputeHint: "maybe" | "unlikely" | "often_yes";
  steps: string[];
  documents: string[];
  portals: string[];
};

const PORTALS = [
  "mParivahan app / parivahan.gov.in — challan status aur online payment/dispute ke liye.",
  "Apne state transport / traffic police ki official website (city ke hisaab se).",
];

export function explainChallan(params: {
  amount: number;
  offenceText?: string | null;
  city?: string | null;
}): ChallanExplainResult {
  const t = (params.offenceText ?? "").toLowerCase();
  const city = params.city ?? "aapke shehar";

  let canDispute: ChallanExplainResult["canDisputeHint"] = "maybe";
  let extra: string[] = [];

  if (t.includes("signal") || t.includes("red light")) {
    canDispute = "unlikely";
    extra = [
      "Signal jump ka challan aksar camera ya witness proof par hota hai — dispute mushkil.",
      "Agar aapko lagta hai galat vehicle number ya galat photo hai, to turant portal par objection follow karo.",
    ];
  } else if (t.includes("speed")) {
    canDispute = "maybe";
    extra = [
      "Speed camera calibration aur signage ka matter ho sakta hai — proof mangwane ka option dekho.",
    ];
  } else if (t.includes("puc") || t.includes("pollution")) {
    canDispute = "often_yes";
    extra = [
      "PUC expire hone par challan common hai — agar valid PUC thi aur system update nahi hua, to receipt ke saath dispute kiya ja sakta hai.",
    ];
  } else if (t.includes("helmet") || t.includes("seat belt")) {
    canDispute = "unlikely";
    extra = [
      "Helmet/seat belt violation aksar on-spot ya photo proof se hota hai.",
    ];
  } else {
    extra = [
      "Har offence ka rule alag hota hai — challan slip par offence code aur section padho.",
    ];
  }

  return {
    title: `Challan ₹${params.amount} — ${city}`,
    simpleHindi: [
      `Ye amount aapko ${city} ke traffic/e-challan system ne fix kiya hoga.`,
      "Pehle official app/website par challan verify karo — kab, kahan, kaun sa offence.",
      ...extra,
      "Jaldi payment par discount kabhi milta hai — due date miss mat karo warna jurmana badh sakta hai.",
    ],
    canDisputeHint: canDispute,
    steps: [
      "mParivahan ya state portal par login karke challan number se status dekho.",
      "Agar galat vehicle/driver lagta hai to 'Representation' / grievance option dekho (state-wise alag).",
      "Agar court appearance likha hai to date yaad rakho — miss karne par warrant/jurmana badh sakta hai.",
      "Help ke liye traffic helpdesk / legal aid clinic (general) — serious case me vakil se salah lena behtar hai.",
    ],
    documents: [
      "RC, Driving License, Insurance, PUC (jo relevant ho).",
      "Challan slip / SMS screenshot.",
      "Agar dispute: photos, witness, payment receipts jo proof ho.",
    ],
    portals: PORTALS,
  };
}
