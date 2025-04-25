document.addEventListener("DOMContentLoaded", () => {
    const logo = document.querySelector(".logo");

    if (logo) {
        // Give the browser a moment to render the initial styles before applying animation
        setTimeout(() => {
            logo.classList.add("fade-in");
        }, 200); // delay by 100ms
    } else {
        console.warn("Logo not found in DOM");
    }

    // Animate nav links after logo fades in
    const navLinks = document.querySelectorAll(".nav-column a");

    navLinks.forEach((link, index) => {
        setTimeout(() => {
            link.parentElement.classList.add("swoop-in");
        }, 1100 + index * 300); // nav starts after logo
    });

    function viewProduct(slug) {
        alert(`Load product page for: ${slug}`);
        // Later, you can redirect or show a modal here
    }



    const products = {
        "face1": {
          name: "Face Tee 1",
          image: "face1.png",
          description: "Bold and weird. Trippy face tee on ultra-soft cotton.",
          related: ["face2", "face3"]
        },
        "face2": {
          name: "Face Tee 2",
          image: "face2.png",
          description: "Scribble line art for cosmic chill.",
          related: ["face1", "face3"]
        },
        "face3": {
          name: "Face Tee 3",
          image: "face3.png",
          description: "The third eye never blinks. Glow up time.",
          related: ["face1", "face2"]
        }
      };
      
      let currentProductSlug = "";
      
      function viewProduct(slug) {
        const product = products[slug];
        if (!product) return;
      
        currentProductSlug = slug;
      
        document.getElementById("modal-image").src = product.image;
        document.getElementById("modal-title").textContent = product.name;
        document.getElementById("modal-description").textContent = product.description;
      
        document.getElementById("modal-size").value = "M";
        document.getElementById("modal-quantity").value = 1;
      
        // Related
        const relatedContainer = document.getElementById("related-products");
        relatedContainer.innerHTML = "";
        product.related.forEach(relatedSlug => {
          const r = products[relatedSlug];
          const div = document.createElement("div");
          div.className = "product-card";
          div.innerHTML = `
            <img src="${r.image}" alt="${r.name}">
            <h3>${r.name}</h3>
          `;
          div.onclick = () => viewProduct(relatedSlug);
          relatedContainer.appendChild(div);
        });
      
        document.getElementById("product-modal").classList.remove("hidden");
      }
      
      function closeModal() {
        document.getElementById("product-modal").classList.add("hidden");
      }
      
      function addToCart() {
        const size = document.getElementById("modal-size").value;
        const quantity = parseInt(document.getElementById("modal-quantity").value);
        const product = products[currentProductSlug];
      
        const item = {
          slug: currentProductSlug,
          name: product.name,
          size,
          quantity,
          image: product.image
        };
      
        let cart = JSON.parse(localStorage.getItem("cart") || "[]");
        cart.push(item);
        localStorage.setItem("cart", JSON.stringify(cart));
      
        alert(`Added ${quantity}x ${product.name} [${size}] to cart!`);
        closeModal();
      }
      
    
});
