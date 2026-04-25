# 테스트 픽스처

`parse-docx.ts`의 회귀 테스트용 .docx 샘플을 여기 둡니다.

## 권장 픽스처

| 파일명                        | 시나리오                           |
| ----------------------------- | ---------------------------------- |
| `sample-employee.docx`        | 사원 모드 정상 보고서              |
| `sample-leader.docx`          | 팀장 모드 보고서 (팀원 N명)        |
| `sample-empty-content.docx`   | 내용은 비었지만 헤더는 있는 케이스 |
| `sample-with-subdetails.docx` | 세부내용(`- `) 다단 케이스         |

## 픽스처 추가 방법

1. 위 양식의 .docx 파일을 이 폴더에 저장 (gitignore 안 됨, 커밋 권장)
2. `parse-docx.test.ts`에서 `it.skip` 풀고 기대값 수정
3. `npm test` 통과 확인

> 보안: 실제 사내 문서는 절대 커밋 X. 가짜 데이터로 채운 샘플만.
