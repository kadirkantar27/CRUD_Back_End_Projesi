## 📦 Kurulum ve Çalıştırma Rehberi (Installation & Setup)

Projeyi kendi yerel ortamınızda (localhost) çalıştırmak için aşağıdaki adımları sırasıyla izleyin.

### Ön Koşullar
* Bilgisayarınızda **Node.js** (v14 veya üzeri) yüklü olmalıdır.
* Proje veritabanı işlemleri için **Prisma ORM** kullanmaktadır (Varsayılan olarak SQLite veya PostgreSQL kullanabilirsiniz).

### Adım 1: Projeyi İndirin (Clone Repository)
İlk olarak projeyi GitHub üzerinden kendi bilgisayarınıza klonlayın ve proje dizinine geçiş yapın:
```bash
git clone https://github.com/KULLANICI_ADINIZ/helpdesk-api.git
cd helpdesk-api
```

### Adım 2: Bağımlılıkları Kurun (Install Dependencies)
Projenin çalışması için gerekli olan Node.js paketlerini (Express, Prisma, Socket.IO vb.) indirmek için şu komutu çalıştırın:
```bash
npm install
```

### Adım 3: Çevre Değişkenlerini (Environment Variables) Ayarlayın
Proje ana dizininde `.env` adında gizli bir dosya oluşturun ve içerisine aşağıdaki yapılandırma değişkenlerini kendi bilgilerinize göre ekleyin:
```env
PORT=3000
DATABASE_URL="file:./dev.db" # veya PostgreSQL kullanıyorsanız kendi bağlantı adresiniz
JWT_SECRET="cok_gizli_anahtar_kelimeniz"

# Nodemailer Ethereal SMTP Test Ayarları
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="ethereal_kullanici_adiniz"
SMTP_PASS="ethereal_sifreniz"
```

### Adım 4: Veritabanını Hazırlayın (Database Migration)
Prisma kullanarak veritabanı tablolarını (`User`, `Ticket`, `Comment`) oluşturmak ve istemciyi (client) senkronize etmek için şu komutları sırasıyla çalıştırın:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Adım 5: Sunucuyu Başlatın
Tüm kurulumlar tamamlandı. Geliştirme (development) modunda sunucuyu ayağa kaldırmak için:
```bash
npm run dev
```
*(Sunucu başarıyla başladığında terminalde "Server is running on port 3000" mesajını göreceksiniz.)*