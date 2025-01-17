/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./src/js/**/*.js", "/pages/*.html"],
  theme: {
    extend: {
      colors: {
        main: "#1E88E5",
        secondary: "#F5F5F5",
        action: "#4CAF50",
        out: "rgb(240, 56, 56)",
        // success: "#81c784",
        mainBg: "#ffffff",
        card: "#f5f5f5",
        shadow: "(rgba(0,0,0,0,1))",
        // main: "#1c75bc",
        // secondary: "#00E676",
        // // action: "#FF7043",
        // re1: "#ffffff",
        // re2: "#000000",
      },
      backgroundImage: {
        "custom-gradient":
          "linear-gradient(to right bottom, #e8eae3, #c3bfba, #9c9795, #767171, #504e4f)",
      },
      fontFamily: {
        poppins: "Poppins",
        Montserrat: "Montserrat",
      },
      fontSize: {
        xxs: "0.6rem",
      },
    },
  },
  plugins: [],
};
