// The base URL for the ARTIC API artworks endpoint
const baseUrl = "https://api.artic.edu/api/v1/artworks/";

const randomizeButton = document.querySelector("#randomize-button");
const gallery = document.querySelector("#gallery");

// The number of artworks generated each time the button is clicked
const totalArtworks = 15;

// Finding the number of artworks in the ARTIC API on page load
let maxIndex = 100000; // fallback value
window.addEventListener("load", async () => {
  const tempArtwork = await fetchArtworkByIndex(1);
  if (tempArtwork !== null) {
    maxIndex = tempArtwork.pagination.total;
  }
});

// The ARTIC API gives results in pages, each holding a set number of artworks.
// By setting `limit=1`, we make sure each page only gives us one artwork.
// That way, we can use the `page` number like an id, which helps in fetching
// random artworks later.
const fetchArtworkByIndex = async (index) => {
  const requestUrl = `${baseUrl}?page=${index}&limit=1`;
  try {
    const response = await fetch(requestUrl);
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

// We only want artworks with an image we can display.
const hasImageId = (artwork) => {
  return artwork.data[0].image_id !== null;
};

const fetchRandomArtworks = async (totalNumber) => {
  const artworks = [];
  const triedIndices = new Set();

  // Attempt to fetch artworks that have images.
  // To avoid infinite loops, retry up to totalNumber * 3 times.
  let attempts = 0;
  let maxAttempts = totalNumber * 3;

  while (artworks.length < totalNumber && attempts <= maxAttempts) {
    attempts++;

    const randomIndex = Math.floor(Math.random() * maxIndex) + 1;
    if (triedIndices.has(randomIndex)) continue;
    triedIndices.add(randomIndex);

    const artwork = await fetchArtworkByIndex(randomIndex);
    if (hasImageId(artwork)) artworks.push(artwork);
  }

  return artworks;
};

const toggleButton = (button, enabledText, disabledText) => {
  button.disabled = !button.disabled;
  button.innerText = button.disabled ? disabledText : enabledText;
};

const makeGalleryItem = (artwork) => {
  const iiifUrl = artwork.config.iiif_url;
  const artworkData = artwork.data[0];
  const imageId = artworkData.image_id;
  const img = document.createElement("img");
  // The image source link form is specified in the ARTIC API.
  // I'm using smaller resolution images because I found that I got
  // denied access to some larger ones, and the thumbnail is small anyway.
  img.src = `${iiifUrl}/${imageId}/full/400,/0/default.jpg`;
  img.alt = artworkData.thumbnail.alt_text;

  const link = document.createElement("a");
  link.href = `https://www.artic.edu/artworks/${artworkData.id}`;
  link.target = "_blank";

  const overlay = document.createElement("div");
  const overlayText = document.createElement("p");
  overlayText.innerHTML = "Read More &nearr;";

  overlay.appendChild(overlayText);
  overlay.classList.add("overlay");

  link.appendChild(overlay);

  const galleryItem = document.createElement("div");
  galleryItem.classList.add("gallery-item");
  galleryItem.appendChild(img);
  galleryItem.appendChild(link);

  return galleryItem;
};

const renderGallery = (artworks) => {
  gallery.innerHTML = "";
  for (let artwork of artworks) {
    const galleryItem = makeGalleryItem(artwork);
    gallery.appendChild(galleryItem);
  }
};

randomizeButton.addEventListener("click", async function () {
  toggleButton(this, "Randomize", "Loading...");

  const artworks = await fetchRandomArtworks(totalArtworks);
  renderGallery(artworks);

  toggleButton(this, "Randomize", "Loading...");
});
