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
        kind: "Crested",
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
        kind: "Crested",
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
        kind: "Crested",
        description: ["With an air of absolute nobility, Dynastag rules over its forest domain. It uses its hardened wooden cane with the flawless grace of a master fencer, deflecting enemy attacks with a single, effortless parry.",
            "When it shakes its elegant, ornate antlers, the delicate bell-flowers ring out a rhythmic chime. This sound relaxes allies, but to its enemies, it is the chilling signal that a duel has begun."
        ],
        signatureMove: "Counterattack"
    },

    pyrowl: {
        num: 2003,
        name: "Pyrowl",
        types: ["Fire"],
        genderRatio: {M: 0.875, F: 0.125},
        baseStats: {hp: 55, atk: 65, def: 45, spa: 50, spd: 48, spe: 55},
        abilities: {0: "Blaze", H: "Sand Rush"},
        heightm: 0.4,
        weightkg: 5.5,
        kind: "Prowler",
        description: ["It inhabits arid badlands and volcanic crags, using the dark, ash-colored fur on its face to shield its eyes from intense desert sun glare. It tracks prey patiently through clouds of dust.",
            "Highly alert, Pyrowl constantly monitors shifting geothermal currents beneath its paws. If cornered, it beats its tail against the parched earth to create a blinding smokescreen of ash."
            ],
        signatureMove: null
    },
    pyroncho: {
        num: 2004,
        name: "Pyroncho",
        types: ["Fire"],
        genderRatio: {M: 0.875, F: 0.125},
        baseStats: {hp: 80, atk: 85, def: 65, spa: 55, spd: 70, spe: 65},
        abilities: {0: "Blaze", H: "Sand Rush"},
        heightm: 1.0,
        weightkg: 26.0,
        kind: "Prowler",
        description: ["The thick poncho around its neck is formed from compressed stone that perfectly insulates its intense internal heat. Volcanic vents protruding from its back constantly billow out heavy smoke to conceal its presence.",
            "It keeps its front paws hidden beneath its heavy coat, making its quick-striking embers completely unpredictable. It uses the sharp, brim-like fur on its head to shield its eyes from falling volcanic ash."
        ],
        signatureMove: null
    },
    smoldero: {
        num: 2005,
        name: "Smoldero",
        types: ["Fire", "Ground"],
        genderRatio: {M: 0.875, F: 0.125},
        baseStats: {hp: 100, atk: 120, def: 85, spa: 65, spd: 75, spe: 85},
        abilities: {0: "Blaze", H: "Sand Rush"},
        heightm: 1.6,
        weightkg: 88.5,
        kind: "Prowler",
        description: ["Known as the lawless apex of the volcanic plains, Smoldero commands absolute authority with a menacing glare. The three whip-like tails on its back hold superheated obsidian stones that it hurls with lethal, pinpoint accuracy.",
            "Its stone-like greaves are formed from layers of cooled, hardened magma, protecting its legs during high-speed pursuits. Its glowing, fiery fangs can melt through solid iron, leaving molten scorch marks on anything it bites."
        ],
        signatureMove: "Desperado Strike"
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