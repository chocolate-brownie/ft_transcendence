// A wrapper around `<button>` with the theme:
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "lime";
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-pong-accent text-pong-background hover:bg-pong-accentDark",
    secondary: "bg-black/10 text-pong-text hover:bg-black/20 border border-black/10",
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30",
    lime: "bg-pong-secondary text-white hover:bg-lime-moss-700",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Dans la parie CSS de tailwind https://play.tailwindcss.com/ :
// @tailwind base;
// @tailwind components;
// @tailwind utilities;

// Dans la partie config -> le fichier tailwind.config.js

//Dans le HTML:
{/* <h1><b> < Button > est utilisé dans Game.tsx :</b></h1>
<br>
<!-- <br> -->
<div className="mt-7 flex gap-5">
  <button class="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 bg-pong-accent text-pong-background hover:bg-pong-accentDark">
    New Game
  </button>
  <button class="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
    Quit Game
  </button>
</div>
<br>
<h2><b>  < button >  !=  < Button > </b>(défini dans <i>/components/Button</i>) : les deux sont utilisés dans le projet.
</h2>
<br>
<p>
  Lorsqu'on définit les <i>props</i> d'un bouton comme ça en React:<br> 
  <b>
    type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    <br>
    variant?: "primary" | "secondary" | "danger" | "lime";
    <br>};
  </b>
  <br>
  Cela veut dire que le bouton va hériter des propriétés par défaut d'un bouton React :
  <br>
  <ol>
    <li><b>• onPress</b> : fonction/évènement provoqué en appuyant sur le bouton</li>
    <li><b>• title</b> : texte à l'intérieur du bouton</li>
    <li><b>• accessibilityLabel</b> (pour les malvoyants, type string)</li>
    <li><b>• accessibilityActions</b> (de type array)</li>
    <li><b>• disabled</b> : toutes les actions sont désactivée si ce booléen est true</li>
    <li>...</li>
  </ol>
  Et on peut lui ajouter d'autres propriétés, comme les "variant" ici.
  <br><br>
  <b>
  export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props}: 
  </b>
  <br>
  Veut dire que le < Button > peut avoir les "paramètres" <i>variant</i> (par défaut = "primary"), <i>className</i> (par défaut = ""), etc. Et <i>...props</i> va représenter tous les paramètres d'un bouton React citées précédemment. 
  <br>
  <b>
  ButtonProps) { <br>
  const base = "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50";
  const variants = { <br>
    primary: "bg-pong-accent text-pong-background hover:bg-pong-accentDark",<br>
    secondary: "bg-black/10 text-pong-text hover:bg-black/20 border border-black/10",<br>
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30",<br>
    lime: "bg-pong-secondary text-white hover:bg-lime-moss-700",<br>
  };
  </b>
</p> */}
