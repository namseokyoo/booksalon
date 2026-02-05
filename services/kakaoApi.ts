
import { Book } from '../types';

// 카카오 API 키 설정 (환경 변수에서 가져오기)
const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY || process.env.KAKAO_API_KEY;

const API_URL = 'https://dapi.kakao.com/v3/search/book';

export async function searchBookByIsbn(isbn: string): Promise<Book | null> {
  console.log('🔍 ISBN 검색 시작:', isbn);
  console.log('🔑 API 키:', KAKAO_API_KEY ? '설정됨' : '설정되지 않음');

  if (!KAKAO_API_KEY) {
    console.error("❌ Kakao API key is not set. Please set process.env.KAKAO_API_KEY.");
    return null;
  }

  try {
    const url = `${API_URL}?target=isbn&query=${isbn}`;
    console.log('🌐 API URL:', url);

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    });

    console.log('📡 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 응답 오류:', errorText);
      throw new Error(`Failed to fetch book from Kakao API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📚 API 응답 데이터:', data);

    if (data.documents && data.documents.length > 0) {
      const bookData = data.documents[0];
      console.log('📖 첫 번째 책 데이터:', bookData);

      // Kakao API returns ISBN with a space sometimes (e.g., "8937462428 9788937462424")
      const cleanIsbn = bookData.isbn.split(' ')[0];
      const result = {
        isbn: cleanIsbn,
        title: bookData.title,
        authors: bookData.authors,
        publisher: bookData.publisher,
        thumbnail: bookData.thumbnail,
        contents: bookData.contents,
      };
      console.log('✅ 변환된 책 데이터:', result);
      return result;
    }

    console.log('⚠️ 검색 결과 없음');
    return null;
  } catch (error) {
    console.error('❌ ISBN 검색 오류:', error);
    return null;
  }
}

export async function searchBookByTitle(title: string): Promise<Book[]> {
  console.log('🔍 제목 검색 시작:', title);
  console.log('🔑 API 키:', KAKAO_API_KEY ? '설정됨' : '설정되지 않음');

  if (!KAKAO_API_KEY) {
    console.error("❌ Kakao API key is not set. Please set process.env.KAKAO_API_KEY.");
    return [];
  }

  try {
    const url = `${API_URL}?query=${encodeURIComponent(title)}`;
    console.log('🌐 API URL:', url);

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    });

    console.log('📡 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 응답 오류:', errorText);
      throw new Error(`Failed to fetch book from Kakao API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📚 API 응답 데이터:', data);

    if (data.documents && data.documents.length > 0) {
      const books = data.documents.map((bookData: any) => {
        console.log('📖 책 데이터:', bookData);

        // Kakao API returns ISBN with a space sometimes (e.g., "8937462428 9788937462424")
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
      console.log('✅ 변환된 책 목록:', books);
      return books;
    }

    console.log('⚠️ 검색 결과 없음');
    return [];
  } catch (error) {
    console.error('❌ 제목 검색 오류:', error);
    return [];
  }
}
