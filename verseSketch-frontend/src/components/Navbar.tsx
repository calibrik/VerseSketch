import { FC } from "react";
interface INavbarProps {};

export const Navbar: FC<INavbarProps> = (_) => {
    return (
        <nav className="navbar">
            <h2>VerseSketch</h2>
        </nav>
    );
}
