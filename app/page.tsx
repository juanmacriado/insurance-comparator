import { auth } from "@/auth";
import LandingPageClient from "@/components/LandingPageClient";

export default async function LandingPage() {
    const session = await auth();

    return (
        <LandingPageClient session={session} />
    );
}
