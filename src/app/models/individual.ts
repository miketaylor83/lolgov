export class Individual {
    index: number;
    age: number;
}

export class UserInputs {
    agi: number;
    adults: number;
    children: number;
    fplPct: number;
    individual: boolean;
    actualMonthlyPremium: number;
    isFamily: boolean;
    childrenAges: Individual[];
    adultAges: Individual[];
    valid: boolean;
}