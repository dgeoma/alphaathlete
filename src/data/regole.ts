// Le regole della casa, in un posto solo: le leggono la home (sezione #regole), la pagina /regole/ e il passo delle regole
// del questionario (`elenco: titoliRegole`). Testi: copy v2 §3.9, incollati così come sono.
// Per cambiare una regola si cambia QUI, una volta: le tre pagine si aggiornano da sole.
export interface Regola {
  /** titolo della regola, senza numero (il numero romano lo mette chi la stampa) */
  titolo: string;
  /** uno o più paragrafi */
  testo: string[];
  /** il motivo della regola (riga «Perché») */
  perche: string;
  /** cosa succede se non viene rispettata: l'etichetta cambia da regola a regola («Se non la rispetti», «Se succede»…) */
  se: { etichetta: string; testo: string };
}

export const romano = (x: number): string =>
  ([['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]] as [string, number][]).reduce((s, [l, v]) => { while (x >= v) { s += l; x -= v; } return s; }, '');

/** Etichetta, titolo e riga sotto il titolo. La riga è diversa in home (chi legge deve ancora candidarsi) e in /regole/. */
export const testataRegole = {
  etichetta: 'Le regole della casa',
  titolo: 'Sette regole. Valgono per tutti, me compreso.',
  rigaHome: 'Le leggi prima di candidarti e, se entri, ti impegni a rispettarle. Se sono io a non rispettarne una, chiunque me lo può dire: in privato o davanti a tutti.',
  rigaPagina: 'Se sono io a non rispettarne una, chiunque me lo può dire: in privato o davanti a tutti.',
};

export const regole: Regola[] = [
  {
    titolo: 'Le scuse restano alla porta.',
    testo: [
      'Qui racconti quello che è successo e quello che fai adesso. «Non ho avuto tempo» diventa «non l’ho messo prima di altro». Un limite vero non è una scusa: una malattia, un lutto, un figlio piccolo si dicono e basta. Nessuno li discute.',
    ],
    perche: 'una scusa detta bene convince anche chi la dice. Detta in un gruppo, contagia.',
    se: { etichetta: 'Se non la rispetti', testo: 'qualcuno te lo fa notare, con rispetto. Se diventa un’abitudine, ne parliamo io e te.' },
  },
  {
    titolo: 'La gara è con te.',
    testo: [
      'Qui conta quello che dipende da te: le missioni che chiudi e il passo avanti rispetto a dove eri. Fatturato e follower restano fuori dal conto. Il primo cliente si racconta: è una missione chiusa. Sul profilo la piattaforma mostra un livello: come funziona te lo spiego il primo giorno. Una classifica dei membri non c’è.',
    ],
    perche: 'il confronto con gli altri, usato male, ti fa recitare.',
    se: { etichetta: 'Se non la rispetti', testo: 'un post fatto per mettersi sopra gli altri viene tolto, e ne parliamo.' },
  },
  {
    titolo: 'Zero tossicità.',
    testo: [
      'È tossico: deridere una domanda o un errore. Sminuire il risultato di un altro. Vantarsi per far sentire indietro qualcuno. Fare sarcasmo sulla persona invece di criticare il lavoro. Attaccare qualcuno per il genere, l’età, la provenienza, il mestiere. Fare pressione in privato. Parlare male di chi non c’è.',
      'Va benissimo, invece: dire una verità scomoda con rispetto. Essere in disaccordo. Criticare un lavoro in modo diretto e utile.',
    ],
    perche: 'in un posto dove si rischia di essere derisi, nessuno porta le cose che contano.',
    se: { etichetta: 'Se non la rispetti', testo: 'un richiamo solo. La seconda volta esci dal gruppo. Per gli attacchi alla persona esci subito. Di quello che succede in un messaggio privato vengo a saperlo solo se me lo dici: scrivimi.' },
  },
  {
    titolo: 'Ci si aiuta a vicenda.',
    testo: [
      'Chi sa una cosa la mette a disposizione di chi ne ha bisogno. Quando chiedi una mano, racconta cosa hai già provato: chi ti risponde parte da lì. Se ti accorgi che ti lamenti e basta, chiedi una mano: siamo qui per questo. Se non te ne accorgi, te lo dico in privato.',
    ],
    perche: 'un mestiere si impara più in fretta accanto a chi lo sta imparando con te.',
    se: { etichetta: 'Se non succede', testo: 'se per settimane prendi e non porti, te lo dico in privato e capiamo insieme cosa ti blocca.' },
  },
  {
    titolo: 'Quello che si dice qui resta qui.',
    testo: [
      'Niente schermate portate fuori. Niente registrazioni passate ad altri. Se una chiamata viene registrata, lo dico prima di cominciare e la registrazione resta nel gruppo. La storia di un’altra persona la racconta solo lei. Della tua esperienza, invece, parli con chi vuoi: partner, terapeuta, chiunque.',
    ],
    perche: 'si parla di sconfitte, di paure, di lavoro. Si può fare solo se ci si fida.',
    se: { etichetta: 'Se non la rispetti', testo: 'esci dal gruppo, anche alla prima volta.' },
  },
  {
    titolo: 'Qui non si vende agli altri membri.',
    testo: [
      'Né nei post né in privato. Se vuoi dire cosa fai e cosa cerchi, c’è un posto solo per farlo, e te lo indico il primo giorno. Le collaborazioni che nascono lavorando fianco a fianco sono le benvenute: facciamo lo stesso mestiere, ed è normale che succeda.',
    ],
    perche: 'chi comincia a guardare gli altri come clienti smette di allenarsi con loro.',
    se: { etichetta: 'Se non la rispetti', testo: 'il post viene tolto. Alla seconda, una pausa dal gruppo. Se qualcuno ti scrive in privato per venderti qualcosa, dimmelo: lo vengo a sapere solo così.' },
  },
  {
    titolo: 'Questo non è un percorso di cura.',
    testo: [
      'Qui si lavora anche sulle emozioni e su ciò che ti muove senza che tu lo veda. È allenamento. Non è terapia e non la sostituisce. Nessuno fa diagnosi a un altro, nessuno dà consigli su farmaci o cure. Se quello che porti esce da ciò che qui sappiamo fare, te lo dico in privato e con rispetto: per quel tipo di aiuto la strada è un professionista della salute.',
    ],
    perche: 'voglio che tu abbia l’aiuto giusto dalla persona giusta.',
    se: { etichetta: 'Se succede', testo: 'non è una punizione. Ne parliamo io e te e decidiamo insieme come continuare.' },
  },
];

/** i soli titoli, per l'elenco numerato del questionario (il motore mette i numeri romani) */
export const titoliRegole: string[] = regole.map((r) => r.titolo);
