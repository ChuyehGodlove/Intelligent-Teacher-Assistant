import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import classesRouter from "./classes";
import studentsRouter from "./students";
import testsRouter from "./tests";
import resultsRouter from "./results";
import uploadsRouter from "./uploads";
import dashboardRouter from "./dashboard";
import analysisRouter from "./analysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/classes", classesRouter);
router.use("/students", studentsRouter);
router.use("/tests", testsRouter);
router.use("/results", resultsRouter);
router.use("/uploads", uploadsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/analysis", analysisRouter);

export default router;
