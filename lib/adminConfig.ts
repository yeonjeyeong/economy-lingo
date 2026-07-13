/**
 * 관리자 권한은 Firebase Authentication의 서명된 ID 토큰에 있는
 * custom claim으로만 판별한다. 이메일 주소는 권한 근거로 사용하지 않는다.
 */
export function hasAdminClaim(claims: object | null | undefined): boolean {
    return Boolean(claims && 'admin' in claims && claims.admin === true);
}
