export const pokedex = {

    fawnna: {
        num: 2000,
        name: "Fawnna",
        types: ["Grass"],
        genderRatio: {M: 0.875, F: 0.125},
        baseStats: {hp: 45, atk: 65, def: 50, spa: 40, spd: 55, spe: 63},
        abilities: {0: "Overgrow", H: "Steadfast"},
        heightm: 0.4,
        weightkg: 6,
        kind: "Budding Fawn",
        description: ["Incredibly timid, Fawnna hide deep within dense bamboo and copihue groves. If they sense danger, they freeze completely, hoping the flower buds on their heads blend into the brush.",
            "The twin buds on its head absorb solar energy to keep it warm. When it feels completely safe around its Trainer, the buds emit a soft, comforting glow and a sweet, calming scent."
        ],
        signatureMove: null
    },
    fawliage: {
        num: 2001,
        name: "Fawliage",
        types: ["Grass"],
        genderRatio: {M: 0.875, F: 0.125},
        baseStats: {hp: 60, atk: 85, def: 65, spa: 55, spd: 70, spe: 83},
        abilities: {0: "Overgrow", H: "Steadfast"},
        heightm: 0.9,
        weightkg: 22.5,
        kind: "Noble Yearling",
        description: ["Having grown more confident, Fawliage actively patrols its territory. It wears a thick poncho of leaves that acts as a solar panel, channeling energy into its rapidly growing wooden antlers.",
            "It takes immense pride in its appearance, spending hours grooming its foliage. It practices martial discipline by using its bark-covered rear legs to deliver precise, swift kicks against tree trunks."
        ],
        signatureMove: null
    },
    dynastag: {
        num: 2002,
        name: "Dynastag",
        types: ["Grass", "Fighting"],
        genderRatio: {M: 0.875, F: 0.125},
        baseStats: {hp: 75, atk: 121, def: 75, spa: 60, spd: 82, spe: 117},
        abilities: {0: "Overgrow", H: "Sharpness"},
        heightm: 1.7,
        weightkg: 68,
        kind: "Grand Monarch",
        description: ["With an air of absolute nobility, Dynastag rules over its forest domain. It uses its hardened wooden cane with the flawless grace of a master fencer, deflecting enemy attacks with a single, effortless parry.",
            "When it shakes its elegant, ornate antlers, the delicate bell-flowers ring out a rhythmic chime. This sound relaxes allies, but to its enemies, it is the chilling signal that a duel has begun."
        ],
        signatureMove: "Floral Flourish"
    },

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
    necrondor: {
        num: 2022,
        name: "Necrondor",
        types: ["Ghost", "Flying"],
        genderRatio: {M: 0.5, F: 0.5},
        baseStats: {hp: 100, atk: 60, def: 70, spa: 100, spd: 105, spe: 75},
        abilities: {0: "Early Bird", 1: "Unnerve", H: "Mummy"},
        heightm: 1,
        weightkg: 15,
        kind: "Deception",
        description: ["Necrondor are long-lived and their bones are said to grant eternal life. Many ancient funerary sites are said to be guarded by Necrondor, who will attack anyone who tries to steal from them.",
            "Its tattered wings protect it from the chilling winds of the mountains they call home. They stand still for hours, watching the land with their hypnotic gaze."
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
        ], "signatureMove": "Strength Sap"
    }

}