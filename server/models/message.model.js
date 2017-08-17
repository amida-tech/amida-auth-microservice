

/**
 * Message Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        to: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false
        },
        from: {
            type: DataTypes.STRING,
            allowNull: false
        },
        subject: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    });

    return Message;
};