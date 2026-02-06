/**
 * 검색 히스토리 서비스
 * localStorage 기반으로 최근 검색어를 관리합니다.
 */

const STORAGE_KEY = 'booksalon_search_history';
const MAX_HISTORY_COUNT = 10;

export interface SearchHistory {
  term: string;
  timestamp: number;
}

export class SearchHistoryService {
  /**
   * 검색 히스토리 조회
   */
  static getHistory(): SearchHistory[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const history = JSON.parse(stored) as SearchHistory[];
      // 유효한 항목만 반환
      return history.filter(
        item => item.term && typeof item.term === 'string' && item.timestamp
      );
    } catch (error) {
      console.error('검색 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * 검색어를 히스토리에 추가
   * 중복 검색어는 최신 위치로 이동
   */
  static addToHistory(term: string): void {
    if (!term.trim()) return;

    try {
      const normalized = term.trim();
      let history = this.getHistory();

      // 중복 제거 (대소문자 무시)
      history = history.filter(
        item => item.term.toLowerCase() !== normalized.toLowerCase()
      );

      // 새 항목을 맨 앞에 추가
      history.unshift({
        term: normalized,
        timestamp: Date.now(),
      });

      // 최대 개수 제한
      if (history.length > MAX_HISTORY_COUNT) {
        history = history.slice(0, MAX_HISTORY_COUNT);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('검색 히스토리 추가 실패:', error);
    }
  }

  /**
   * 특정 검색어를 히스토리에서 삭제
   */
  static removeFromHistory(term: string): void {
    try {
      const history = this.getHistory().filter(
        item => item.term.toLowerCase() !== term.toLowerCase()
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('검색 히스토리 삭제 실패:', error);
    }
  }

  /**
   * 전체 검색 히스토리 삭제
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('검색 히스토리 초기화 실패:', error);
    }
  }

  /**
   * 검색어 목록만 반환 (term만 추출)
   */
  static getHistoryTerms(): string[] {
    return this.getHistory().map(item => item.term);
  }

  /**
   * 검색어로 히스토리 필터링 (자동완성용)
   */
  static filterHistory(prefix: string): string[] {
    if (!prefix.trim()) {
      return this.getHistoryTerms();
    }

    const normalized = prefix.toLowerCase();
    return this.getHistory()
      .filter(item => item.term.toLowerCase().includes(normalized))
      .map(item => item.term);
  }
}
