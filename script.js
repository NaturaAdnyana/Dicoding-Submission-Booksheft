const books = [];
let filteredBooks = [];
const RENDER_EVENT = "render";
let isSearchMode = false;

document.addEventListener("DOMContentLoaded", function () {
  const submitForm = document.getElementById("add-form");
  const searchForm = document.getElementById("search-form");

  submitForm.addEventListener("submit", function (event) {
    event.preventDefault();
    isSearchMode = false;
    searchForm.reset();
    addBook();
    submitForm.reset();
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    submitForm.reset();
    filteredBooks = [];
    const bookTitle = document.getElementById("cari").value;
    console.log(bookTitle);
    if (bookTitle === "") {
      console.log("betul kosong");
      isSearchMode = false;
    } else {
      isSearchMode = true;
      searchBook(bookTitle);
      console.log(isSearchMode);
    }
    document.dispatchEvent(new Event(RENDER_EVENT));
  });

  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

function addBook() {
  const id = generateId();
  const getTitle = document.getElementById("judul").value;
  const getAuthor = document.getElementById("penulis").value;
  const getYear = document.getElementById("tahun").value;
  const getIsComplete = document.getElementById("selesai").checked;

  const bookObject = generateBookObject(
    id,
    getTitle,
    getAuthor,
    getYear,
    getIsComplete
  );
  books.push(bookObject);

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  triggerDialog("Berhasil menambahkan buku ", getTitle, getAuthor);
}

function generateId() {
  return +new Date();
}

function generateBookObject(id, title, author, year, isComplete) {
  return {
    id,
    title,
    author,
    year,
    isComplete,
  };
}

function searchBook(bookTitle) {
  for (const book of books) {
    if (book.title.toLowerCase() === bookTitle.toLowerCase()) {
      filteredBooks.push(book);
    }
  }
}

document.addEventListener(RENDER_EVENT, function () {
  const bookTitle = document.getElementById("cari").value;
  const unfinishedBooks = document.getElementById("unfinished-books");
  unfinishedBooks.innerHTML = "";
  const finishedBooks = document.getElementById("finished-books");
  finishedBooks.innerHTML = "";

  if (isSearchMode) {
    const [countCompleteBooks, countUncompleteBooks] =
      countBooks(filteredBooks);
    if (countCompleteBooks === 0) {
      finishedBooks.append(addMessage(`Tidak ada hasil "${bookTitle}"`));
    }
    if (countUncompleteBooks === 0) {
      unfinishedBooks.append(addMessage(`Tidak ada hasil "${bookTitle}"`));
    }
    for (const book of filteredBooks) {
      const bookElement = makeBook(book);
      if (!book.isComplete) {
        unfinishedBooks.append(bookElement);
      } else {
        finishedBooks.append(bookElement);
      }
    }
  } else {
    const [countCompleteBooks, countUncompleteBooks] = countBooks(books);
    if (countCompleteBooks === 0) {
      finishedBooks.append(addMessage("Anda belum memasukkan buku"));
    }
    if (countUncompleteBooks === 0) {
      unfinishedBooks.append(addMessage("Anda belum memasukkan buku"));
    }
    for (const book of books) {
      const bookElement = makeBook(book);
      if (!book.isComplete) {
        unfinishedBooks.append(bookElement);
      } else {
        finishedBooks.append(bookElement);
      }
    }
  }
});

function addMessage(message) {
  const noResultMessage = document.createElement("div");
  noResultMessage.classList.add("no-result-message");
  noResultMessage.innerText = message;
  return noResultMessage;
}

function makeBook(bookData) {
  const bookDetail = document.createElement("div");
  bookDetail.classList.add("book-detail");

  const bookTitle = document.createElement("span");
  bookTitle.classList.add("judul-buku");
  bookTitle.innerText = bookData.title;

  const bookYear = document.createElement("span");
  bookYear.classList.add("tahun-buku");
  bookYear.innerText = " - " + bookData.year;

  const bookAuthor = document.createElement("span");
  bookAuthor.classList.add("penulis-buku");
  bookAuthor.innerText = bookData.author;

  const bookHeader = document.createElement("div");
  bookHeader.append(bookTitle, bookYear);

  bookDetail.append(bookHeader, bookAuthor);

  const actionsContainer = document.createElement("div");
  actionsContainer.classList.add("actions");

  const bookContainer = document.createElement("div");
  bookContainer.classList.add("buku");
  bookContainer.setAttribute("id", bookData.id);
  bookContainer.append(bookDetail, actionsContainer);

  if (bookData.isComplete) {
    const undoButton = document.createElement("button");
    undoButton.classList.add("undo-btn");

    undoButton.addEventListener("click", function () {
      undoBookFromFinished(bookData.id);
    });
    actionsContainer.append(undoButton);
  } else {
    const checkButton = document.createElement("button");
    checkButton.classList.add("finished-btn");

    checkButton.addEventListener("click", function () {
      addBookToFinished(bookData.id);
    });
    actionsContainer.append(checkButton);
  }

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-btn");
  deleteButton.addEventListener("click", function () {
    removeBook(bookData.id);
    triggerDialog("Berhasil menghapus buku ", bookData.title, bookData.author);
  });

  actionsContainer.append(deleteButton);

  return bookContainer;
}

function undoBookFromFinished(bookId) {
  const bookTarget = findBook(bookId);

  if (bookTarget == null) return;
  bookTarget.isComplete = false;

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBook(bookId) {
  for (const book of books) {
    if (book.id === bookId) {
      return book;
    }
  }
  return null;
}

function addBookToFinished(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;
  bookTarget.isComplete = true;

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function removeBook(bookId) {
  const bookTarget = findBookIndex(bookId);
  const filteredBookTarget = findFilteredBookIndex(bookId);
  if (bookTarget == -1) return;
  books.splice(bookTarget, 1);
  filteredBooks.splice(filteredBookTarget, 1);

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBookIndex(bookId) {
  for (const index in books) {
    if (books[index].id === bookId) {
      return index;
    }
  }
  return -1;
}

function findFilteredBookIndex(bookId) {
  for (const index in filteredBooks) {
    if (filteredBooks[index].id === bookId) {
      return index;
    }
  }
  return -1;
}

const SAVED_EVENT = "saved-books";
const STORAGE_KEY = "SAVED_BOOKS";

function isStorageExist() {
  if (typeof Storage === "undefined") {
    alert("Browser kamu tidak mendukung local storage");
    return false;
  }
  return true;
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(books);
    localStorage.setItem(STORAGE_KEY, parsed);
  }
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (const book of data) {
      books.push(book);
    }
  }

  document.dispatchEvent(new Event(RENDER_EVENT));
}

function countBooks(books) {
  let countCompleteBooks = 0;
  let countUncompleteBooks = 0;
  for (const book of books) {
    if (book.isComplete) {
      countCompleteBooks++;
    } else if (!book.isComplete) {
      countUncompleteBooks++;
    }
  }
  return [countCompleteBooks, countUncompleteBooks];
}

function triggerDialog(message, bookTitle, bookAuthor) {
  const dialogBox = document.getElementById("dialog-box");
  const dialog = document.createElement("div");
  dialog.classList.add("dialog");
  dialog.setAttribute("id", "dialog");
  dialog.innerHTML = `${message} "<i>${bookTitle}</i>" - "<i>${bookAuthor}</i>"`;
  dialogBox.append(dialog);
  setTimeout(function () {
    dialog.classList.add("dialog-show");
  }, 100);
  setTimeout(function () {
    dialog.classList.remove("dialog-show");
  }, 1500);
  setTimeout(function () {
    dialog.remove();
  }, 2000);
}
