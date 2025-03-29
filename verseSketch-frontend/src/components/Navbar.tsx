import { FC } from "react";
interface INavbarProps {};

export const Navbar: FC<INavbarProps> = (props) => {
    return (
        <nav className="navbar">
            <h2>VerseSketch</h2>
        </nav>
    );
}
