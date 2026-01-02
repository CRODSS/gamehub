export interface Category {
    id: string;
    name: string;
    icon: string;
    items: string[];
    objectLabel: string; // e.g. "Mekan", "Kişi", "Yiyecek"
}

export const GAME_CATEGORIES: Category[] = [
    {
        id: 'celebrities',
        name: 'Ünlüler & Fenomenler',
        icon: '🌟',
        objectLabel: 'Kişi',
        items: [
            "Tarkan", "Cem Yılmaz", "Müslüm Gürses", "Bülent Ersoy", "Zeki Müren",
            "Kemal Sunal", "Şener Şen", "Adile Naşit", "Haluk Bilginer", "Kıvanç Tatlıtuğ",
            "Kenan İmirzalıoğlu", "Beren Saat", "Serenay Sarıkaya", "Acun Ilıcalı", "Nusret",
            "Reynmen", "Edis", "Aleyna Tilki", "Sezen Aksu", "İbrahim Tatlıses",
            "Seda Sayan", "Mehmet Ali Erbil", "Beyazıt Öztürk", "Okan Bayülgen", "Barış Manço",
            "Fatih Terim", "Arda Turan", "Mesut Özil", "Naim Süleymanoğlu", "Mustafa Kemal Atatürk",
            "Elon Musk", "Mark Zuckerberg", "Bill Gates", "Steve Jobs", "Jeff Bezos",
            "Cristiano Ronaldo", "Lionel Messi", "Neymar", "Michael Jordan", "LeBron James",
            "Muhammed Ali", "Mike Tyson", "Michael Jackson", "Madonna", "Shakira",
            "Rihanna", "Beyoncé", "Justin Bieber", "Eminem", "Adele",
            "Brad Pitt", "Angelina Jolie", "Johnny Depp", "Leonardo DiCaprio", "Tom Cruise",
            "Will Smith", "Jackie Chan", "Bruce Lee", "Marilyn Monroe", "Elvis Presley",
            "Donald Trump", "Vladimir Putin", "Kraliçe Elizabeth", "Albert Einstein", "Nikola Tesla"
        ]
    },
    {
        id: 'places',
        name: 'Mekanlar',
        icon: '📍',
        objectLabel: 'Mekan',
        items: [
            "Hastane", "Okul / Sınıf", "Polis Karakolu", "İtfaiye İstasyonu", "Havaalanı",
            "Uçak İçi", "Otobüs Terminali", "Tren İstasyonu", "Metro İstasyonu", "Metrobüs",
            "Vapur / Feribot", "Denizaltı", "Uzay İstasyonu", "Ay Yüzeyi", "Mars Kolonisi",
            "Futbol Stadyumu", "Spor Salonu (Gym)", "Yüzme Havuzu", "Hamam / Sauna", "Masaj Salonu",
            "Kuaför / Berber", "Süpermarket", "Pazar Yeri", "AVM (Alışveriş Merkezi)", "Sinema Salonu",
            "Tiyatro Sahnesi", "Konser Alanı", "Müze", "Kütüphane", "Üniversite Kampüsü",
            "Cami", "Kilise", "Mezarlık", "Düğün Salonu", "Disko / Gece Kulübü",
            "Casino / Kumarhane", "Hapishane", "Mahkeme Salonu", "Banka", "Postane",
            "Otel Lobisi", "Restoran Mutfağı", "Pastane", "Kahvehanesi", "İnternet Kafe",
            "Lunapark", "Sirk Çadırı", "Hayvanat Bahçesi", "Akvaryum", "Çiftlik",
            "Orman Kampı", "Plaj / Sahil", "Çöl", "Kutup (Buzul)", "Mağara",
            "Savaş Cephesi", "Korsan Gemisi", "Perili Köşk", "Şantiye Alanı", "Fabrika"
        ]
    },
    {
        id: 'foods',
        name: 'Yiyecek & İçecek',
        icon: '🍔',
        objectLabel: 'Yiyecek',
        items: [
            "Lahmacun", "Adana Kebap", "İskender", "Döner", "Köfte Ekmek",
            "Kokoreç", "Midye Dolma", "Çiğ Köfte", "Mantı", "Zeytinyağlı Sarma",
            "Kuru Fasulye", "Pilav", "Mercimek Çorbası", "Tarhana", "İşkembe Çorbası",
            "Menemen", "Sucuklu Yumurta", "Simit", "Poğaça", "Börek",
            "Gözleme", "Pide", "Hamsi Tava", "Lüfer", "Turşu",
            "Baklava", "Künefe", "Sütlaç", "Kazandibi", "Lokum",
            "Türk Kahvesi", "Çay", "Ayran", "Şalgam", "Rakı",
            "Pizza", "Hamburger", "Cheeseburger", "Hot Dog", "Patates Kızartması",
            "Sushi", "Noodle", "Taco", "Burrito", "Lazanya",
            "Makarna (Spagetti)", "Ramen", "Kruvasan", "Waffle", "Pancake",
            "Karpuz", "Kavun", "Çilek", "Muz", "Elma",
            "Limon", "Sarımsak", "Soğan", "Acı Biber", "Patlamış Mısır",
            "Dondurma", "Çikolata", "Cips", "Kola", "Su"
        ]
    },
    {
        id: 'jobs',
        name: 'Meslekler',
        icon: '💼',
        objectLabel: 'Meslek',
        items: [
            "Doktor", "Hemşire", "Diş Hekimi", "Cerrah", "Veteriner",
            "Öğretmen", "Profesör", "Öğrenci", "Müdür", "Hademe",
            "Polis", "Dedektif", "Asker / Komutan", "İtfaiye Eri", "Zabıta",
            "Hakim", "Savcı", "Avukat", "Gardiyan", "Güvenlik Görevlisi",
            "Pilot", "Hostes", "Kaptan (Gemi)", "Şoför (Taksi/Otobüs)", "Kurye / Kargocu",
            "Aşçı", "Garson", "Barmen", "Barista", "Fırıncı",
            "Kasap", "Manav", "Bakkal", "Berber / Kuaför", "Terzi",
            "İnşaat İşçisi", "Mimar", "Mühendis", "Elektrikçi", "Tesisatçı",
            "Yazılımcı", "Grafik Tasarımcı", "Youtuber / Yayıncı", "Gazeteci", "Fotoğrafçı",
            "Oyuncu (Aktör)", "Şarkıcı", "Ressam", "Yazar", "Manken",
            "Futbolcu", "Hakem", "Antrenör", "Astronot", "Bilim İnsanı",
            "Çiftçi", "Balıkçı", "Çoban", "Arkeolog", "İmam / Rahip",
            "Cumhurbaşkanı", "Muhtar", "Casus / Ajan", "Hırsız", "Sihirbaz"
        ]
    },
    {
        id: 'animals',
        name: 'Hayvanlar Alemi',
        icon: '🦁',
        objectLabel: 'Hayvan',
        items: [
            "Aslan", "Kaplan", "Leopar", "Çita", "Jaguar",
            "Kedi", "Köpek", "Kurt", "Tilki", "Ayı",
            "Kutup Ayısı", "Panda", "Koala", "Kanguru", "Maymun / Goril",
            "Fil", "Gergedan", "Su Aygırı", "Zürafa", "Zebra",
            "At", "Eşek", "Deve", "İnek", "Boğa",
            "Koyun", "Keçi", "Domuz", "Tavşan", "Sincap",
            "Fare / Sıçan", "Kirpi", "Yarasa", "Köstebek", "Kunduz",
            "Kartal", "Şahin", "Baykuş", "Papağan", "Muhabbet Kuşu",
            "Tavuk / Horoz", "Hindi", "Ördek", "Kaz", "Kuğu",
            "Penguen", "Flamingo", "Devekuşu", "Leylek", "Martı",
            "Yılan", "Kertenkele", "Timsah", "Kaplumbağa", "Bukalemun",
            "Kurbağa", "Balina", "Yunus", "Köpekbalığı", "Ahtapot",
            "Denizanası", "Yengeç", "İstakoz", "Denizatı", "Hamsi",
            "Sivrisinek", "Karasinek", "Arı", "Karınca", "Örümcek",
            "Akrep", "Kelebek", "Uğur Böceği", "Çekirge", "Solucan"
        ]
    },
    {
        id: 'fictional',
        name: 'Kurgusal Karakterler',
        icon: '🎭',
        objectLabel: 'Karakter',
        items: [
            "Polat Alemdar", "Süleyman Çakır", "Memati Baş", "Ramiz Dayı", "Ezel Bayraktar",
            "Behzat Ç.", "Harun Sinanoğlu", "Hürrem Sultan", "Bihter Ziyagil", "Kuzey Tekinoğlu",
            "Recep İvedik", "Arif Işık (GORA)", "Erdal Bakkal", "İsmail Abi", "Mecnun Çınar",
            "Burhan Altıntop", "Volkan Konak (Avrupa Yakası)", "Kel Mahmut", "İnek Şaban", "Güdük Necmi",
            "Batman", "Superman", "Spider-Man", "Iron Man", "Captain America",
            "Thor", "Hulk", "Black Widow", "Wolverine", "Deadpool",
            "Joker", "Thanos", "Loki", "Wonder Woman", "Aquaman",
            "Harry Potter", "Voldemort", "Dumbledore", "Gandalf", "Frodo Baggins",
            "Gollum", "Darth Vader", "Luke Skywalker", "Yoda", "Obi-Wan Kenobi",
            "Jack Sparrow", "James Bond", "John Wick", "Forrest Gump", "Rocky Balboa",
            "Terminator", "Neo (Matrix)", "Vito Corleone (Godfather)", "Sherlock Holmes", "Dracula",
            "Frankenstein", "Tarzan", "Zorro", "Robin Hood", "Walter White (Heisenberg)",
            "Sünger Bob", "Patrick", "Mickey Mouse", "Bugs Bunny", "Tom & Jerry",
            "Tweety", "Daffy Duck", "Scooby Doo", "Şirin Baba", "Gargamel",
            "Pikachu", "Ash Ketchum", "Goku", "Naruto", "Luffy",
            "Shrek", "Eşek (Shrek)", "Buzz Lightyear", "Woody", "Elsa (Frozen)",
            "Minyonlar", "Pembe Panter", "Temel Reis", "Red Kit", "Keltek (Keloğlan)"
        ]
    }
];
