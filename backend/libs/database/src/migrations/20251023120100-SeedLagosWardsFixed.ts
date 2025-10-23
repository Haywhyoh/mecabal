import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedLagosWardsFixed20251023120100 implements MigrationInterface {
    name = 'SeedLagosWardsFixed20251023120100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Map of LGA names to their ward data
        const lgaWardsData = [
            {
                lga: 'Mushin',
                wards: ['Mushin Atewolara', 'Papa Ajao', 'Alafia Adeoyo', 'Igbehin', 'Baba Olosa', 'Moshalasi/Agoro', 'Onitire', 'Oduselu/Ola', 'Odo Eran/Ogunlana', 'Idi Araba']
            },
            {
                lga: 'Agege',
                wards: ['Isokoko', 'Kara/Oko-Oba', 'Keke', 'Dopemu', 'Orile Agege', 'Ajegunle', 'Tabon Tabon', 'Oke-Koto', 'Oko-Oba', 'Oke-Koto/Oko-Oba']
            },
            {
                lga: 'Ifako-Ijaiye',
                wards: ['Ijaiye/Onibuku', 'Fadayi/Abule Egba', 'Oke-Ira/Ajuwon', 'Obama/Okera', 'Oke Ifo/Aiyeteju', 'Ojokoro/Akinyele', 'Oke Odo/Atan', 'Adelaja/Obele', 'Aiyetoro/Alakuko', 'Ijaiye/Ojokoro']
            },
            {
                lga: 'Alimosho',
                wards: ['Agbado/Oke Odo', 'Alimosho', 'Ipaja South', 'Ipaja North', 'Mosan', 'Idimu', 'Akowonjo', 'Egbe', 'Shasha', 'Isolo']
            },
            {
                lga: 'Lagos Mainland',
                wards: ['Eboyi/Igbobi', 'Alagomeji', 'Ebute Meta West', 'Ebute Meta East', 'Apapa Road', 'Otto/Iddo', 'Otto', 'Oyadiran', 'Fadayi/Alagomeji', 'Adekunle']
            },
            {
                lga: 'Lagos Island',
                wards: ['Olowogbowo', 'Idumagbo', 'Isale Eko', 'Ita Faji', 'Ojuolape', 'Oja-Oba', 'Ojuolape II', 'Idumota', 'Oko Awo', 'Oko Faji']
            },
            {
                lga: 'Eti-Osa',
                wards: ['Ikoyi', 'Obalende', 'Victoria Island', 'Ilasan', 'Ado/Okun Ajah', 'Lafiaji', 'Obalende II', 'Ikate', 'Ilubirin']
            },
            {
                lga: 'Ibeju-Lekki',
                wards: ['Akodo', 'Eleko', 'Lakowe', 'Ajah', 'Ibeju', 'Okun Ajah', 'Abule Panshire', 'Ibeju II', 'Lakowe II', 'Ajah II']
            },
            {
                lga: 'Epe',
                wards: ['Poka', 'Epe', 'Popo-Obadore', 'Odo-Egiri', 'Lagos Road', 'Epe II', 'Ajegunle', 'Itoikin', 'Ogunmodi', 'Ilara']
            },
            {
                lga: 'Ikorodu',
                wards: ['Agura/Ipakodo', 'Ikorodu I', 'Ikorodu II', 'Bayeku/Ogolonto', 'Erikorodo', 'Imota', 'Igbogbo I', 'Igbogbo II', 'Iwerekun', 'Owutu']
            },
            {
                lga: 'Kosofe',
                wards: ['Ojota', 'Ketu', 'Alapere', 'Agboyi', 'Ifako', 'Anthony', 'Maryland', 'Ojodu', 'Ifako II', 'Ifako III']
            },
            {
                lga: 'Ikeja',
                wards: ['Ikeja', 'Alausa', 'Opebi', 'Oregun', 'Maryland', 'Anthony', 'Ojodu', 'Ogba', 'Agidingbi', 'Ikeja GRA']
            },
            {
                lga: 'Surulere',
                wards: ['Akerele', 'Ijeshatedo', 'Itire', 'Lawanson', 'Mushin', 'Orile', 'Aguda', 'Shitta', 'Rabiu', 'Tejuosho']
            },
            {
                lga: 'Ajeromi-Ifelodun',
                wards: ['Tolu', 'Ijegun', 'Ijegun II', 'Ijegun III', 'Oriwu', 'Ifelodun', 'Ijora Badia', 'Ojo Road', 'Ijora Badia II', 'Ifelodun II']
            },
            {
                lga: 'Apapa',
                wards: ['Apapa', 'Iganmu', 'Ijora', 'Ijora II', 'Ojora', 'Iganmu II', 'Marine Beach', 'Ajegunle', 'Ojo Road', 'Tincan']
            },
            {
                lga: 'Amuwo-Odofin',
                wards: ['Festac', 'Mile 2', 'Kirikiri', 'Ijegun', 'Trade Fair', 'Satellite', 'Kirikiri II', 'Abule Ado', 'Ilasamaja', 'Kirikiri III']
            },
            {
                lga: 'Ojo',
                wards: ['Ojo', 'Okokomaiko', 'Ajangbadi', 'Iba', 'Ojo II', 'Iyana-Iba', 'Ajangbadi II', 'Ojo III', 'Ojo IV', 'Ojo V']
            },
            {
                lga: 'Badagry',
                wards: ['Ajara', 'Ikoga', 'Topo', 'Ilogbo', 'Whiskey', 'Mosafejo', 'Popo', 'Badagry', 'Gberefu', 'Awhanjigoh']
            },
            {
                lga: 'Shomolu',
                wards: ['Shomolu', 'Bajulaiye', 'Gbagada', 'Bariga', 'Palmgrove', 'Fola Agoro', 'Ilaje', 'Pedro', 'Onipanu', 'Shomolu II']
            },
            {
                lga: 'Oshodi-Isolo',
                wards: ['Oshodi', 'Mafoluku', 'Isolo', 'Ajao Estate', 'Okota', 'Shogunle', 'Ilasamaja', 'Oshodi II', 'Bolade', 'Ladipo']
            }
        ];

        // Check the actual data type of IDs in the database
        const tableInfo = await queryRunner.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'local_government_areas' AND column_name = 'id'
        `);

        const idType = tableInfo[0]?.data_type;
        console.log(`LGA ID type: ${idType}`);

        // Get Lagos state
        const lagosState = await queryRunner.query(
            `SELECT id FROM states WHERE name = 'Lagos' LIMIT 1`
        );

        if (!lagosState || lagosState.length === 0) {
            console.log('Lagos state not found, skipping ward seeding');
            return;
        }

        const lagosStateId = lagosState[0].id;
        console.log(`Lagos state ID: ${lagosStateId}, type: ${typeof lagosStateId}`);

        // Process each LGA and its wards
        for (const lgaData of lgaWardsData) {
            // Find LGA by name
            const lga = await queryRunner.query(
                `SELECT id FROM local_government_areas WHERE name = $1 LIMIT 1`,
                [lgaData.lga]
            );

            if (!lga || lga.length === 0) {
                console.log(`LGA ${lgaData.lga} not found, skipping...`);
                continue;
            }

            const lgaId = lga[0].id;
            console.log(`Processing ${lgaData.lga} with ID: ${lgaId}, type: ${typeof lgaId}`);

            // Insert wards for this LGA
            for (const wardName of lgaData.wards) {
                // Check if ward already exists
                const existingWard = await queryRunner.query(
                    `SELECT id FROM wards WHERE name = $1 AND lga_id = $2`,
                    [wardName, lgaId]
                );

                if (existingWard && existingWard.length > 0) {
                    console.log(`Ward ${wardName} already exists in ${lgaData.lga}, skipping...`);
                    continue;
                }

                // Generate a ward code from the name (first 3 letters, uppercase)
                const wardCode = wardName
                    .replace(/[^a-zA-Z]/g, '')
                    .substring(0, 3)
                    .toUpperCase();

                try {
                    // Insert ward - let PostgreSQL handle the ID generation
                    await queryRunner.query(
                        `INSERT INTO wards (name, code, lga_id, created_at, updated_at)
                         VALUES ($1, $2, $3, NOW(), NOW())`,
                        [wardName, wardCode, lgaId]
                    );

                    console.log(`✓ Inserted ward: ${wardName} in ${lgaData.lga}`);
                } catch (error) {
                    console.error(`✗ Failed to insert ward ${wardName}:`, error.message);
                    // Continue with next ward instead of failing the entire migration
                }
            }
        }

        console.log('Ward seeding completed');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Get Lagos state ID
        const lagosState = await queryRunner.query(
            `SELECT id FROM states WHERE name = 'Lagos' LIMIT 1`
        );

        if (!lagosState || lagosState.length === 0) {
            console.log('Lagos state not found, skipping ward deletion');
            return;
        }

        const lagosStateId = lagosState[0].id;

        // Delete all wards for Lagos LGAs
        await queryRunner.query(
            `DELETE FROM wards
             WHERE lga_id IN (
                 SELECT id FROM local_government_areas WHERE state_id = $1
             )`,
            [lagosStateId]
        );

        console.log('Ward deletion completed');
    }
}
