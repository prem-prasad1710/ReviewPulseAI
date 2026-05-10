import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 bg-gradient-to-b from-teal-900 to-teal-700 px-6 py-16 text-white">
      <div>
        <p className="text-sm uppercase tracking-widest text-teal-200/90">DriverSaathi</p>
        <h1 className="mt-2 text-3xl font-black leading-tight">गिग ड्राइवर का हिसाब-किताब और सुरक्षा साथी</h1>
        <p className="mt-3 text-teal-100/95">
          कमाई चेक, चालान, लोन लाल झंडे, कागज़ की याद, फेक मैसेज — Hindi-first, WhatsApp-ready.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/d"
          className="rounded-2xl bg-white py-4 text-center text-lg font-bold text-teal-900 shadow-lg"
        >
          ऐप खोलें
        </Link>
        <Link href="/d/login" className="text-center text-sm text-teal-100 underline">
          लॉगिन
        </Link>
        <Link href="/admin" className="text-center text-xs text-teal-200/80">
          Admin
        </Link>
      </div>
    </main>
  );
}
