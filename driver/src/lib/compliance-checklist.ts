export type VehicleKind = "bike_taxi" | "auto" | "car" | "lcv";

export type ChecklistItem = {
  id: string;
  labelHi: string;
  detailHi: string;
  mandatory: boolean;
};

const BASE: ChecklistItem[] = [
  {
    id: "dl",
    labelHi: "ड्राइविंग लाइसेंस",
    detailHi: "वैध DL, आपकी गाड़ी क्लास के अनुसार।",
    mandatory: true,
  },
  {
    id: "rc",
    labelHi: "RC (पंजीकरण)",
    detailHi: "गाड़ी का RC — नाम और expiry चेक करें।",
    mandatory: true,
  },
  {
    id: "insurance",
    labelHi: "बीमा",
    detailHi: "Third-party ज़रूरी; OD अगर लिया है तो renewal date।",
    mandatory: true,
  },
  {
    id: "puc",
    labelHi: "PUC (प्रदूषण)",
    detailHi: "वैध PUC स्टिकर / ऑनलाइन स्टेटस।",
    mandatory: true,
  },
];

const BY_VEHICLE: Record<VehicleKind, ChecklistItem[]> = {
  bike_taxi: [
    ...BASE,
    {
      id: "helmet",
      labelHi: "हेलमेट",
      detailHi: "चालक + सवारी के लिए नियमों के हिसाब से।",
      mandatory: true,
    },
  ],
  auto: [
    ...BASE,
    {
      id: "permit",
      labelHi: "परमिट / बैज",
      detailHi: "शहर के नियम — ऑटो/कैब परमिट जहाँ लागू हो।",
      mandatory: true,
    },
  ],
  car: [
    ...BASE,
    {
      id: "commercial",
      labelHi: "कमर्शियल नंबर / बैज",
      detailHi: "ऐप टैक्सी के लिए यलो प्लेट / कमर्शियल RC जाँच।",
      mandatory: true,
    },
    {
      id: "fitness",
      labelHi: "फिटनेस (भारी वाहन)",
      detailHi: "LCV/ट्रक जैसे वाहनों पर लागू।",
      mandatory: false,
    },
  ],
  lcv: [
    ...BASE,
    {
      id: "fitness",
      labelHi: "फिटनेस सर्टिफिकेट",
      detailHi: "Commercial goods vehicle — ज़्यादातर ज़रूरी।",
      mandatory: true,
    },
    {
      id: "tax",
      labelHi: "टैक्स टोकन / ग्रीन टैक्स",
      detailHi: "राज्य के हिसाब से।",
      mandatory: false,
    },
  ],
};

export function getComplianceChecklist(vehicle: VehicleKind): ChecklistItem[] {
  return BY_VEHICLE[vehicle] ?? BY_VEHICLE.auto;
}

export const VEHICLE_LABELS: Record<VehicleKind, string> = {
  bike_taxi: "बाइक टैक्सी / Rapido",
  auto: "ऑटो रिक्शा",
  car: "कार (Ola/Uber)",
  lcv: "LCV / छोटा ट्रक",
};
