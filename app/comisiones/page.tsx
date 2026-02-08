
import { auth } from "@/auth";
import ComisionesClientPage from "./client-page";
import { Users, LogOut } from "lucide-react";
import Link from 'next/link';
import { logout } from "@/lib/auth-actions";

export default async function ComisionesPage() {
    const session = await auth();

    return (
        <>
            {/* Header extension now on landing page */}

            <ComisionesClientPage />
        </>
    );
}
