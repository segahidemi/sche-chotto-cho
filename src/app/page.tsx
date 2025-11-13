import CreateScheduleForm from "@/components/CreateScheduleForm";

export default function HomePage() {
  return (
    <main className="container">
      <header className="hero">
        <p className="eyebrow">sche-chotto-cho</p>
        <h1>Share one link and find a time that works for everyone.</h1>
        <p className="muted">
          This lightweight Amplify-ready Next.js app stores schedules on the
          server so multiple people can answer simultaneously. Create a schedule
          below and send the link to teammates to collect answers in real time.
        </p>
      </header>

      <CreateScheduleForm />
    </main>
  );
}
