import { Request, Response } from "express";
import Services from "../db/startup/dbServices";
import GeneralRoute from './generalRoute.route';
import authMiddlware from "./middlewares/auth.middleware";
import adminMiddleware from "./middlewares/admin.middleware";
import { OK, INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { IDetailedProduct } from "../db/services/product";
import async from 'async';

const { ProductService } = Services;

export default class ProductRoute extends GeneralRoute {
    constructor() {
        super();
        this.path = "/products";
        this.intializeRoutes();
    }
    intializeRoutes() {
        this.router.post(this.path, [authMiddlware, adminMiddleware]
            , this.addProduct);
        this.router.get(`${this.path}/detailedProduct`, [authMiddlware, adminMiddleware]
            , this.getDetailedProduct);
        this.router.get(`${this.path}/detailedProducts`, [authMiddlware, adminMiddleware]
            , this.getDetailedProduct);
        this.router.put(this.path, [authMiddlware, adminMiddleware]
            , this.updateProductDetails);
        this.router.delete(this.path, [authMiddlware, adminMiddleware], this.deleteProduct);
        this.router.get(this.path, [authMiddlware, adminMiddleware], this.getProducts);

    }
    addProduct = async (req: Request, res: Response) => {
        const { status, details } = await ProductService.addProduct(req.body);
        res.status(status).send({
            status,
            details
        })
    }
    getDetailedProduct = async (req: Request, res: Response) => {
        const { status, details, detailedProduct } = await ProductService.getDetailedProductById(req.body.id);
        if (!detailedProduct) return res.status(status).send({ status, details });
        res.send({
            status,
            detailedProduct,
            details
        })
    }
    getDetailedProducts = async (req: Request, res: Response) => {
        const { status, details, detailedProducts } = await ProductService.getDetailedProducts();
        if (!detailedProducts) return res.status(status).send({ status, details });
        const detailedAvgProducts = async.map(await detailedProducts, async detailedProduct => {
            const {
                status: statusChecking,
                details: detailsChecking,
                avgRank } = await ProductService.getAvgRankForEachProduct((detailedProduct as IDetailedProduct)._id);
            if (detailsChecking) return res.status(statusChecking).send({
                status: statusChecking,
                details: detailsChecking
            })
            const avgRankedProduct = {
                detailedProduct,
                avgRank
            }
            return avgRankedProduct;
        })
        res.send({
            status,
            details,
            detailedProducts: detailedAvgProducts
        })
    }
    updateProductDetails = async (req: Request, res: Response) => {
        const { productId, detailsUpdates } = req.body;
        const { status, details } = await ProductService.updateProductDetails(productId, detailsUpdates);
        res.status(status).send({
            details,
            status
        })
    }
    deleteProduct = async (req: Request, res: Response) => {
        const { status, details } = await ProductService.deleteProduct(req.body.productId);
        res.status(status).send({ status, details });
    }
    getProducts = async (req: Request, res: Response) => {
        try {
            const products = await ProductService.getProducts();
            return res.send({
                status: OK,
                details: products
            })
        } catch (ex) {
            return res.status(INTERNAL_SERVER_ERROR).send({
                status: INTERNAL_SERVER_ERROR,
                details: (ex as Error).message
            })
        }
    }


}