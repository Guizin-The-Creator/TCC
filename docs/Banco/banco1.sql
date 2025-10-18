-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`cargos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`cargos` (
  `idCargo` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeCargo` VARCHAR(45) NULL DEFAULT NULL,
  `prioridadeCargo` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idCargo`))
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`categorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`categorias` (
  `idCategoria` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeCategoria` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idCategoria`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`subcategorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`subcategorias` (
  `idSubcategoria` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeSubcategoria` VARCHAR(45) NULL DEFAULT NULL,
  `idCategoria` INT(11) NOT NULL,
  PRIMARY KEY (`idSubcategoria`),
  INDEX `fk_subcategoria_categoria_idx` (`idCategoria` ASC),
  CONSTRAINT `fk_subcategoria_categoria`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`lancamentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`lancamentos` (
  `idLancamento` INT(11) NOT NULL AUTO_INCREMENT,
  `tituloLancamento` VARCHAR(100) NULL DEFAULT NULL,
  `descricaoLancamento` TEXT NULL DEFAULT NULL,
  `vencimentoLancamento` DATE NULL DEFAULT NULL,
  `valorLancamento` DECIMAL(10,2) NULL DEFAULT NULL,
  `classificacaoLancamento` VARCHAR(45) NULL DEFAULT NULL,
  `pagamentoLancamento` DATE NULL DEFAULT NULL,
  `statusLancamento` VARCHAR(45) NULL DEFAULT NULL,
  `idCategoria` INT(11) NOT NULL,
  `idSubcategoria` INT(11) NOT NULL,
  PRIMARY KEY (`idLancamento`),
  INDEX `fk_lancamentos_categorias1_idx` (`idCategoria` ASC),
  INDEX `fk_lancamentos_subcategorias1_idx` (`idSubcategoria` ASC),
  CONSTRAINT `fk_lancamentos_categorias1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lancamentos_subcategorias1`
    FOREIGN KEY (`idSubcategoria`)
    REFERENCES `mydb`.`subcategorias` (`idSubcategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 17
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`segmentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`segmentos` (
  `idSegmento` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeSegmento` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idSegmento`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`subsegmentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`subsegmentos` (
  `idSubsegmento` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeSubsegmento` VARCHAR(45) NULL DEFAULT NULL,
  `idSegmento` INT(11) NOT NULL,
  PRIMARY KEY (`idSubsegmento`),
  INDEX `fk_subsegmento_segmento1_idx` (`idSegmento` ASC),
  CONSTRAINT `fk_subsegmento_segmento1`
    FOREIGN KEY (`idSegmento`)
    REFERENCES `mydb`.`segmentos` (`idSegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`produtos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`produtos` (
  `idProduto` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeProduto` VARCHAR(45) NULL DEFAULT NULL,
  `custoProduto` DECIMAL(10,2) NULL DEFAULT NULL,
  `idSegmento` INT(11) NOT NULL,
  `idSubsegmento` INT(11) NOT NULL,
  PRIMARY KEY (`idProduto`),
  INDEX `fk_produtos_segmentos1_idx` (`idSegmento` ASC),
  INDEX `fk_produtos_subsegmentos1_idx` (`idSubsegmento` ASC),
  CONSTRAINT `fk_produtos_segmentos1`
    FOREIGN KEY (`idSegmento`)
    REFERENCES `mydb`.`segmentos` (`idSegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_produtos_subsegmentos1`
    FOREIGN KEY (`idSubsegmento`)
    REFERENCES `mydb`.`subsegmentos` (`idSubsegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`tarefas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tarefas` (
  `idTarefa` INT(11) NOT NULL AUTO_INCREMENT,
  `tituloTarefa` VARCHAR(45) NULL DEFAULT NULL,
  `descricaoTarefa` TEXT NULL DEFAULT NULL,
  `prioridadeTarefa` VARCHAR(10) NULL DEFAULT NULL,
  `dataInicio` DATE NULL DEFAULT NULL,
  `dataFim` DATE NULL DEFAULT NULL,
  PRIMARY KEY (`idTarefa`))
ENGINE = InnoDB
AUTO_INCREMENT = 25
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`extratos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`extratos` (
  `idExtrato` INT(11) NOT NULL AUTO_INCREMENT,
  `tituloExtrato` VARCHAR(100) NULL DEFAULT NULL,
  `descricaoExtrato` TEXT NULL DEFAULT NULL,
  `tipoExtrato` VARCHAR(45) NULL DEFAULT NULL,
  `valorExtrato` DECIMAL(10,2) NULL DEFAULT NULL,
  `dataExtrato` DATE NULL DEFAULT NULL,
  `idTarefa` INT(11) NOT NULL,
  `idLancamento` INT(11) NOT NULL,
  `idCategoria` INT(11) NOT NULL,
  `idSubcategoria` INT(11) NOT NULL,
  `idProduto` INT(11) NOT NULL,
  PRIMARY KEY (`idExtrato`),
  INDEX `fk_extratos_tarefas1_idx` (`idTarefa` ASC),
  INDEX `fk_extratos_lancamentos1_idx` (`idLancamento` ASC),
  INDEX `fk_extratos_categorias1_idx` (`idCategoria` ASC),
  INDEX `fk_extratos_subcategorias1_idx` (`idSubcategoria` ASC),
  INDEX `fk_extratos_produtos1_idx` (`idProduto` ASC),
  CONSTRAINT `fk_extratos_categorias1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_lancamentos1`
    FOREIGN KEY (`idLancamento`)
    REFERENCES `mydb`.`lancamentos` (`idLancamento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_produtos1`
    FOREIGN KEY (`idProduto`)
    REFERENCES `mydb`.`produtos` (`idProduto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_subcategorias1`
    FOREIGN KEY (`idSubcategoria`)
    REFERENCES `mydb`.`subcategorias` (`idSubcategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_tarefas1`
    FOREIGN KEY (`idTarefa`)
    REFERENCES `mydb`.`tarefas` (`idTarefa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 12
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`indices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`indices` (
  `idIndice` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeIndice` VARCHAR(45) NULL DEFAULT NULL,
  `taxaIndice` DECIMAL(10,2) NULL DEFAULT NULL,
  `idSubsegmento` INT(11) NOT NULL,
  `anoIndice` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idIndice`),
  INDEX `fk_rentabilidade_subsegmento1_idx` (`idSubsegmento` ASC),
  CONSTRAINT `fk_rentabilidade_subsegmento1`
    FOREIGN KEY (`idSubsegmento`)
    REFERENCES `mydb`.`subsegmentos` (`idSubsegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`orcamentosanuais`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`orcamentosanuais` (
  `idOrcamentoAnual` INT(11) NOT NULL AUTO_INCREMENT,
  `valorOrcamentoAnual` DECIMAL(10,2) NOT NULL,
  `anoOrcamentoAnual` INT(11) NOT NULL,
  `idCategoria` INT(11) NOT NULL,
  PRIMARY KEY (`idOrcamentoAnual`, `idCategoria`),
  UNIQUE INDEX `ano_UNIQUE` (`anoOrcamentoAnual` ASC),
  INDEX `fk_orcamentoanual_categoria1_idx` (`idCategoria` ASC),
  CONSTRAINT `fk_orcamentoanual_categoria1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`orcamentostri`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`orcamentostri` (
  `idOrcamentoTri` INT(11) NOT NULL AUTO_INCREMENT,
  `valorOrcamentoTri` DECIMAL(10,2) NULL DEFAULT NULL,
  `trimestreOrcamentoTri` INT(11) NULL DEFAULT NULL,
  `idOrcamentoAnual` INT(11) NOT NULL,
  `idCategoria` INT(11) NOT NULL,
  PRIMARY KEY (`idOrcamentoTri`, `idCategoria`),
  INDEX `fk_orcamentotri_orcamentoanual1_idx` (`idOrcamentoAnual` ASC),
  INDEX `fk_orcamentotri_categoria1_idx` (`idCategoria` ASC),
  CONSTRAINT `fk_orcamentotri_categoria1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_orcamentotri_orcamentoanual1`
    FOREIGN KEY (`idOrcamentoAnual`)
    REFERENCES `mydb`.`orcamentosanuais` (`idOrcamentoAnual`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 32
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`usuarios` (
  `idUsuario` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeUsuario` VARCHAR(45) NULL DEFAULT NULL,
  `emailUsuario` VARCHAR(45) NULL DEFAULT NULL,
  `senhaUsuario` VARCHAR(45) NULL DEFAULT NULL,
  `dataCadastro` DATETIME NULL DEFAULT NULL,
  `idCargo` INT(11) NOT NULL,
  PRIMARY KEY (`idUsuario`),
  INDEX `fk_usuarios_cargos1_idx` (`idCargo` ASC),
  CONSTRAINT `fk_usuarios_cargos1`
    FOREIGN KEY (`idCargo`)
    REFERENCES `mydb`.`cargos` (`idCargo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 10
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`usuarios_tarefas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`usuarios_tarefas` (
  `tarefas_idTarefa` INT(11) NOT NULL,
  `usuarios_idUsuario` INT(11) NOT NULL,
  `status` ENUM('pendente', 'em andamento', 'concluida') NOT NULL DEFAULT 'pendente',
  PRIMARY KEY (`tarefas_idTarefa`, `usuarios_idUsuario`),
  INDEX `fk_tarefas_has_usuarios_usuarios1_idx` (`usuarios_idUsuario` ASC),
  INDEX `fk_tarefas_has_usuarios_tarefas1_idx` (`tarefas_idTarefa` ASC),
  CONSTRAINT `fk_tarefas_has_usuarios_tarefas1`
    FOREIGN KEY (`tarefas_idTarefa`)
    REFERENCES `mydb`.`tarefas` (`idTarefa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tarefas_has_usuarios_usuarios1`
    FOREIGN KEY (`usuarios_idUsuario`)
    REFERENCES `mydb`.`usuarios` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
