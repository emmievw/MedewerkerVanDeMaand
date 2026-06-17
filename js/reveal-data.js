// =============================================
// REVEAL DATA - Vul dit in vóór de presentatie!
// =============================================
// Kopieer de namen en motivaties uit je Google Sheet
// en vul ze hieronder in. Sorteer van minste naar
// meeste stemmen (de winnaar komt als laatste).
// =============================================

const REVEAL_DATA = {
    // Alle genomineerden, gesorteerd van minst naar meest stemmen
    // De LAATSTE persoon is de winnaar!
    nominees: [
        {
            name: "Naam Persoon 1",
            votes: 1,
            motivations: [
                "Motivatie van iemand..."
            ]
        },
        {
            name: "Naam Persoon 2",
            votes: 2,
            motivations: [
                "Eerste motivatie...",
                "Tweede motivatie..."
            ]
        },
        {
            name: "Naam Persoon 3",
            votes: 3,
            motivations: [
                "Motivatie 1...",
                "Motivatie 2...",
                "Motivatie 3..."
            ]
        }
        // Voeg meer personen toe naar behoefte
        // De laatste in de lijst = de winnaar!
        // Titel wordt automatisch gegenereerd uit motivaties
    ]
};
