<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<!--
	Example usage:

		<xsl:include href="../utilities/autocompleter.xsl"/>

		<xsl:template match="entry[../section/@handle = 'photos']" mode="autocompleter-item-meta">
			<img>
				<xsl:attribute name="src">
					<xsl:value-of select="concat(/data/params/root, '/format/thumbnail', path)"/>
				</xsl:attribute>
			</img>
			<span class="section"><xsl:value-of select="../section"/></span>
		</xsl:template>

		<xsl:template match="/">
			<xsl:apply-templates select="." mode="autocompleter"/>
		</xsl:template>
-->


<!--
	Set value of autocompleterMode parameter.
-->
<xsl:param name="autocompleterMode">
	<xsl:choose>
		<xsl:when test="/data/params/url-qmode = 'embed' or /data/params/url-qmode = 'link'">
			<xsl:value-of select="$url-qmode"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>raw</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:param>


<!--
	Set value of autocompleterPrefix parameter.
	It assumes that SubsectionManager field handle will be the same as its target section handle.
-->
<xsl:template match="entry" mode="autocompleter-item-prefix" priority='0'>
	<xsl:choose>
		<xsl:when test="/data/params/url-qlocal = 'yes'">
			<xsl:value-of select="concat('./', ../section/@handle, '/')"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="concat('/', ../section/@handle, '/')"/>
			<xsl:value-of select="/data/params/url-qfield"/>
			<xsl:text>/</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>


<!--
	Default template for item class.
-->
<xsl:template match="entry" mode="autocompleter-item-class" priority='0'>
	
</xsl:template>


<!--
	Default template for item value.
-->
<xsl:template match="entry" mode="autocompleter-item-value" priority='0'>
	<xsl:value-of select="@id" />
</xsl:template>


<!--
	Default template for item preview.
-->
<xsl:template match="entry" mode="autocompleter-item-preview" priority='0'>
	<xsl:param name="prefix">
		<xsl:apply-templates select="." mode="autocompleter-item-prefix"/>
	</xsl:param>
	<xsl:choose>
		<xsl:when test="$autocompleterMode = 'embed'">
			<xsl:value-of select="concat('[', $prefix, title|name|path|type, ']')"/>
		</xsl:when>
		<xsl:when test="$autocompleterMode = 'link'">
			<xsl:value-of select="concat('(', $prefix, title|name|path|type, ')')"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="concat($prefix, title|name|path|type)"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>


<!--
	Default template for item drop content.
	In embed mode output looks like this: [photos://123].
	In link mode output looks like this: "Great wall photo" (photos://123).
	In raw mode output looks like this: photos://123.
-->
<xsl:template match="entry" mode="autocompleter-item-drop" priority='0'>
	<xsl:choose>
		<xsl:when test="$autocompleterMode = 'embed'">
			<xsl:value-of select="concat('[', ../section/@handle, '://', @id, ']')"/>
		</xsl:when>
		<xsl:when test="$autocompleterMode = 'link'">
			<xsl:value-of select="concat('&quot;', title|name|path|type, '&quot; (', ../section/@handle, '://', @id, ')')"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="concat(../section/@handle, '://', @id)"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>


<!--
	Default template for item select-in field names.
	It assumes that SubsectionManager field handle is the same as its target section handle.
-->
<xsl:template match="entry" mode="autocompleter-item-select-fields" priority='0'>
	<xsl:value-of select="../section/@handle"/>
</xsl:template>


<!--
	Default template for item meta content.
	It outputs entry/date, entry/type and parent section.
-->
<xsl:template match="entry" mode="autocompleter-item-meta" priority='0'>
	<xsl:if test="date">
		<span class="date"><xsl:value-of select="date"/></span>
	</xsl:if>
	<xsl:if test="type">
		<span class="type"><xsl:value-of select="type"/></span>
	</xsl:if>
	<span class="section"><xsl:value-of select="../section"/></span>
</xsl:template>


<!--
	Default template for item text value.
	It outputs entry/title or entry/name or entry/path.
-->
<xsl:template match="entry" mode="autocompleter-item-text" priority='0'>
	<xsl:value-of select="title|name|path"/>
</xsl:template>


<!--
	Build LI element for each entry.
-->
<xsl:template match="entry" mode="autocompleter-item">
	<li>
		<xsl:attribute name="class">
			<xsl:value-of select="concat('item ', ../section/@handle)"/>
			<xsl:apply-templates select="." mode="autocompleter-item-class"/>
		</xsl:attribute>
		<xsl:attribute name="data-value">
			<xsl:apply-templates select="." mode="autocompleter-item-value"/>
		</xsl:attribute>
		<xsl:attribute name="data-preview">
			<xsl:apply-templates select="." mode="autocompleter-item-preview"/>
		</xsl:attribute>
		<xsl:attribute name="data-drop">
			<xsl:apply-templates select="." mode="autocompleter-item-drop"/>
		</xsl:attribute>
		<xsl:attribute name="data-select-in">
			<xsl:apply-templates select="." mode="autocompleter-item-select-fields"/>
		</xsl:attribute>
		<div class="meta">
			<xsl:apply-templates select="." mode="autocompleter-item-meta"/>
		</div>
		<xsl:apply-templates select="." mode="autocompleter-item-text"/>
	</li>
</xsl:template>


<!--
	Select data from sources that have names starting with 'autocomplete'.
	Build UL element for each data source that returned entries.
-->
<xsl:template match="/" mode="autocompleter">
	<xsl:for-each select="data/*[starts-with(local-name(),'autocomplete') and count(entry) &gt; 0]">
		<xsl:apply-templates select="entry" mode="autocompleter-item"/>
	</xsl:for-each>
</xsl:template>


</xsl:stylesheet>