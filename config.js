/* Museum of Us — project configuration.
   Edit names, narration, exhibits, wishes, and voice preferences here. */
const CONFIG = {
  developer: {
    name: "Raven Villarante",
    email: "ravenvillarante231@gmail.com",
  },
  herName: "Babi",
  yourName: "Bebu",
  guide: {
    name: "Curator Milo",
    role: "MUSEUM GUIDE",
    voice: {
      language: "en-US",
      style: "friendly youthful male",
      rate: 1.04,
      pitch: 0.92,
    },
  },
  lobby: {
    title: "WELCOME TO THE MUSEUM",
    story: "Welcome to The Museum of Us, {her}! I'm your curator for today. Every piece in this building is a real moment from your first six months together. Take your time, look around, and talk to me or interact with any glowing exhibit whenever you're ready. Shall we begin?",
  },
  exhibits: [
    {
      title: "Hello, You", date: "MONTH 1", caption: "Oil on a single moment", emoji: "", img: "assets/photos/photo1.jpg", shape: "landscape",
      story: "Our first piece. Nobody in this room knew it yet, but this was the moment everything changed. One simple hello, and suddenly someone had a brand new favorite person."
    },
    {
      title: "The First Date", date: "MONTH 1", caption: "Nervous hearts, mixed media", emoji: "", img: "assets/photos/photo2.jpg", shape: "portrait",
      story: "Look at how nervous we were! The curator notes that the first bond was truly memorable, and the conversation lasted far longer than planned. That is usually a very good sign."
    },
    {
      title: "Getting Comfortable", date: "MONTH 2", caption: "Quiet, softly lit", emoji: "", img: "assets/photos/photo3.jpg", shape: "landscape",
      story: "Somewhere in this period, silence stopped being awkward. Experts agree this is the moment two people realize they can simply be themselves. And it only got better from here."
    },
    {
      title: "The Little Things", date: "MONTH 3", caption: "Tiny moments, huge frame", emoji: "", img: "assets/photos/photo4.jpg", shape: "square",
      story: "The late replies, the tiny dates, the did you eat texts. Critics call these small things. The artist calls them everything."
    },
    {
      title: "Our Adventure", date: "MONTH 4", caption: "Two people, one horizon", emoji: "", img: "assets/photos/photo5.jpg", shape: "landscape",
      story: "Every great museum needs an adventure wing. Here, two people go somewhere new, and honestly, the best part of the view is each other."
    },
    {
      title: "Bad Day, Good Person", date: "MONTH 5", caption: "Soft colors, steady hands", emoji: "", img: "assets/photos/photo6.jpg", shape: "portrait",
      story: "Not every piece in a museum is bright. This one is about a hard day, and someone who stayed anyway. It's the quiet kind of love, and it might be the most important piece in the building."
    },
    {
      title: "Busy, But Yours", date: "MONTH 5", caption: "Deadlines, with a heart facing one way", emoji: "", img: "assets/photos/photo7.jpg", shape: "landscape",
      story: "The artist was extremely busy during this period. Deadlines, work, never enough hours. And yet, look closely, the heart in this painting always faces one direction. Thank you for understanding, always."
    },
    {
      title: "Six Months", date: "MONTH 6", caption: "The newest work in the collection", emoji: "", img: "assets/photos/photo8.jpg", shape: "square",
      story: "And here we are, half a year later. If you ask the curator, this is the most beautiful piece so far. But there is one more room, and it's the most special one. Follow me."
    },
  ],
  finale: {
    title: "Our Future",
    date: "TO BE CONTINUED",
    story: "And now, the final piece. It's not finished, and it never will be, because it belongs to the future. Every museum saves its best for last, and this one is not a painting. It's a wish. Step closer, {her}, and let's make a wish for the whole future of the two of us.",
    wishes: [
      "I wish for a lifetime of mornings next to you.",
      "I wish for us to travel everywhere we dream of, hand in hand.",
      "I wish for more time together. Less busy, more us.",
      "I wish for a home that feels like us.",
      "I wish for us to laugh at the same silly jokes when we're eighty.",
      "I wish for every year to be better than the last, because it's with you.",
    ],
    afterWishes: "The stars have your wishes now. And if you have a wish of your own, you can release it right here.",
    closingTitle: "A letter for {her}",
    closing: `Thank you for walking through this museum with me, {her}.\n\nEvery picture here is a piece of us. The good days, the tired days, and the days I was too busy to say it properly.\n\nI know I don't always have enough time for you. But you never once made me feel like I had to choose, and I'm so lucky for that. I'm working on being better at it, because you deserve more of me.\n\nSix months down, a whole future to go. I wish for all of it, and I wish for it with you.\n\nHappy 6 months, my love.\n\n— {you} 💗`,
  },
};
