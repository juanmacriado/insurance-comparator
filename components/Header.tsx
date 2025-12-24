import Image from 'next/image';

export function Header() {
    return (
        <header className="bg-white shadow-sm border-b border-gray-100">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Using a local proxy or direct URL if permissible. For now using the direct URL */}
                    <img
                        src="https://xeoris.com/wp-content/uploads/2022/06/xeoris-b-a-5.svg"
                        alt="Xeoris Logo"
                        className="h-8 md:h-10"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xeoris-blue font-semibold text-sm md:text-base hidden md:block">
                        CiberSeguro Inteligente
                    </span>
                    <button className="bg-xeoris-blue text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors">
                        Contactar
                    </button>
                </div>
            </div>
        </header>
    );
}
