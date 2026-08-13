// Ambient declaration for plain CSS side-effect imports (`import "./Foo.css"`)
// used by a couple of ported components (ColorBends, DotField). Vite resolves
// these fine at build time; `tsc --noEmit` needs this to type-check them.
declare module "*.css";
