/** 品項圖片上傳的檔案大小上限。跟 next.config.ts 的 experimental.serverActions.bodySizeLimit
 *  互相對應——這裡故意留一點餘裕（8MB < 10MB），讓 multipart 表單本身的額外開銷不會把
 *  一個「剛好卡在上限邊緣」的檔案送到框架層才被拒絕（那樣只會看到很籠統的網路錯誤，
 *  不會是我們自己寫的、講得清楚原因的錯誤訊息）。 */
export const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_IMAGE_LABEL = "8MB";
