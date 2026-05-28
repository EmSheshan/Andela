export const pokedex = {


    aviance: {
        num: 2021,
        name: "Aviance",
        types: ["Ghost", "Flying"],
        genderRatio: {M: 0.5, F: 0.5},
        baseStats: {hp: 70, atk: 50, def: 50, spa: 72, spd: 73, spe: 55},
        abilities: {0: "Early Bird", 1: "Unnerve", H: "Mummy"},
        heightm: 0.26,
        weightkg: 5,
        kind: "Deception",
        description: ["They have uniquely evolved to resemble a human head to frighten others. They are said to lure travelers to their doom by mimicking human laughter.",
            "Aviance enjoy mimicking human laughter, and will often gather in groups to cackle together. To avoid being attacked by Aviance, it is best to join in on their revelry."
        ], "signatureMove": null
    },
    sedimentaldormant: {
        num: 2036,
        name: "Sedimental-Dormant",
        baseForme: "Dormant",
        types: ["Rock", "Grass"],
        genderRatio: {M: 0.5, F: 0.5},
        baseStats: {hp: 85, atk: 81, def: 111, spa: 31, spd: 98, spe: 44},
        abilities: {0: "Cloudburst"},
        heightm: 0.7,
        weightkg: 50,
        otherFormes: ["Sedimental-Bloom"],
        formeOrder: ["Sedimental-Dormant", "Sedimental-Bloom"],
        kind: "Desert Bloom",
        description: ["Rain is so scarce in the desert where Sedimental live that many go their entire lives without opening their petals. Tourists will gather in the rain to see such a rare sight.",
            "Its said that Sedimental is the reincarnation of two lovers who were tragically separated. It constantly searches for its better half, crying in the desert rain."
        ], "signatureMove": null
    },
    sedimentalbloom: {
        num: 2036,
        name: "Sedimental-Bloom",
        baseForme: "Dormant",
        forme: "Bloom",
        types: ["Rock", "Grass"],
        genderRatio: {M: 0.5, F: 0.5},
        baseStats: {hp: 85, atk: 31, def: 98, spa: 131, spd: 161, spe: 44},
        abilities: {0: "Cloudburst"},
        heightm: 0.8,
        weightkg: 50,
        otherFormes: ["Sedimental-Dormant"],
        formeOrder: ["Sedimental-Dormant", "Sedimental-Bloom"],
        kind: "Desert Bloom",
        description: ["Rain is so scarce in the desert where Sedimental live that many go their entire lives without opening their petals. Tourists will gather in the rain to see such a rare sight.",
            "Its said that Sedimental is the reincarnation of two lovers who were tragically separated. It constantly searches for its better half, crying in the desert rain."
        ], "signatureMove": null
    },
    amistaphore: {
        num: 2068,
        name: "Amistaphore",
        types: ["Grass", "Fairy"],
        genderRatio: {M: 0.5, F: 0.5},
        baseStats: {hp: 95, atk: 70, def: 105, spa: 100, spd: 120, spe: 40},
        abilities: {0: "Pacifism", 1: "Effect Spore", H: "Rain Dish"},
        heightm: 3,
        weightkg: 111.2,
        kind: "Illuminating",
        description: ["Its spores have a calming effect on those around it, making them lose the will to fight. Too much exposure can lead to losing one's memory and sense of self.",
            "Amistaphore lets off minor radio signals that can reach across the region. People and Pokémon who are sensitive to the signals are drawn to Amistaphore and will feel a sense of calm and happiness when near it."
        ], "signatureMove": null
    }

}