import { FC } from "react";
import "../index.css";
interface INavbarProps {};

export const Navbar: FC<INavbarProps> = (_) => {
    return (
        <nav className="navbar">
            <h2 className="navbar-title">VerseSketch</h2>
        </nav>
    );
}
