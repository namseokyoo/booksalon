
import { Book } from '../../types';

const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY || process.env.KAKAO_API_KEY;

const API_URL = 'https://dapi.kakao.com/v3/search/book';

export interface BookSearchResult {
  books: Book[];
  isEnd: boolean;
  page: number;
}

interface KakaoBookDocument {
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  contents: string;
}

export async function searchBookByIsbn(isbn: string): Promise<Book | null> {
  if (!KAKAO_API_KEY) {
    console.error("Kakao API key is not set.");
    return null;
  }

  try {
    const url = `${API_URL}?target=isbn&query=${isbn}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', errorText);
      throw new Error(`Failed to fetch book from Kakao API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const bookData = data.documents[0];
      const cleanIsbn = bookData.isbn.split(' ')[0];
      return {
        isbn: cleanIsbn,
        title: bookData.title,
        authors: bookData.authors,
        publisher: bookData.publisher,
        thumbnail: bookData.thumbnail,
        contents: bookData.contents,
      };
    }

    return null;
  } catch (error) {
    console.error('ISBN 검색 오류:', error);
    return null;
  }
}

export async function searchBookByTitle(title: string, page: number = 1, size: number = 10): Promise<BookSearchResult> {
  if (!KAKAO_API_KEY) {
    console.error("Kakao API key is not set.");
    return { books: [], isEnd: true, page };
  }

  try {
    const url = `${API_URL}?query=${encodeURIComponent(title)}&page=${page}&size=${size}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', errorText);
      throw new Error(`Failed to fetch book from Kakao API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const books = data.documents.map((bookData: KakaoBookDocument) => {
        const cleanIsbn = bookData.isbn ? bookData.isbn.split(' ')[0] : 'unknown';
        return {
          isbn: cleanIsbn,
          title: bookData.title,
          authors: bookData.authors,
          publisher: bookData.publisher,
          thumbnail: bookData.thumbnail,
          contents: bookData.contents,
        };
      });
      return {
        books,
        isEnd: data.meta?.is_end ?? true,
        page,
      };
    }

    return { books: [], isEnd: true, page };
  } catch (error) {
    console.error('제목 검색 오류:', error);
    return { books: [], isEnd: true, page };
  }
}
