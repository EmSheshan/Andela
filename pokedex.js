export const pokedex = {

    sedimentaldormant: {
        num: 2000,
        name: "Sedimental-Dormant",
        baseForme: "Dormant",
        types: ["Rock", "Grass"],
        gender: "N",
        baseStats: {hp: 85, atk: 81, def: 111, spa: 31, spd: 98, spe: 44},
        abilities: {0: "Cloudburst"},
        heightm: 0.7,
        weightkg: 50,
        color: "Black",
        otherFormes: ["Sedimental-Bloom"],
        formeOrder: ["Sedimental-Dormant", "Sedimental-Bloom"],
        eggGroups: ["Amorphous"],
        kind: "Desert Bloom",
        description: ["Rain is so scarce in the desert where Sedimental live that many go their entire lives without opening their petals. Many people will gather in the rain to see such a rare sight.",
            "Its said that Sedimental is the reincarnation of two lovers who were tragically separated. It constantly searches for its better half, crying in the desert rain."
        ], "signatureMove": null
    },
    sedimentalbloom: {
        num: 2000,
        name: "Sedimental-Bloom",
        baseForme: "Dormant",
        forme: "Bloom",
        types: ["Rock", "Grass"],
        genderRatio: {M: 0.5, F: 0.5},
        baseStats: {hp: 85, atk: 31, def: 98, spa: 131, spd: 161, spe: 44},
        abilities: {0: "Cloudburst"},
        heightm: 0.8,
        weightkg: 50,
        color: "White",
        otherFormes: ["Sedimental-Dormant"],
        formeOrder: ["Sedimental-Dormant", "Sedimental-Bloom"],
        eggGroups: ["Amorphous"],
        kind: "Desert Bloom",
        description: ["Rain is so scarce in the desert where Sedimental live that many go their entire lives without opening their petals. Many people will gather in the rain to see such a rare sight.",
            "Its said that Sedimental is the reincarnation of two lovers who were tragically separated. It constantly searches for its better half, crying in the desert rain."
        ], "signatureMove": null
    }

}