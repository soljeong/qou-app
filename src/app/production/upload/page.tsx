"use client";

import { useState } from "react";
import { uploadProductionPlan } from "@/actions/uploadExcel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            await uploadProductionPlan(formData);
            router.push("/production");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("업로드 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-6 py-12 flex justify-center">
            <Card className="w-full max-w-lg shadow-sm">
                <CardHeader>
                    <CardTitle>생산 계획 (Excel) 업로드</CardTitle>
                    <CardDescription>
                        주간 생산 계획 엑셀 파일(Daily 생산 계획)을 업로드하여 DB를 최신 상태로 갱신합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex w-full items-center justify-center">
                        <label
                            htmlFor="dropzone-file"
                            className="flex h-56 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                                <svg
                                    className="mb-4 h-10 w-10 text-slate-400"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                </svg>
                                <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                    {file ? file.name : "클릭하거나 파일을 여기로 드래그 하세요."}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Excel 파일 지원 (.xlsx)"}
                                </p>
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept=".xlsx"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.back()}>취소</Button>
                    <Button onClick={handleUpload} disabled={!file || loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? "처리중..." : "데이터베이스 갱신"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
